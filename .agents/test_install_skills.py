from contextlib import redirect_stdout
import importlib.util
import io
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
INSTALLER = ROOT / '.agents/install-skills.py'
spec = importlib.util.spec_from_file_location('pack_installer', INSTALLER)
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallerChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='skill-install-check-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = self.root / 'project with spaces'
        self.project.mkdir()

    def run_installer(self, *args, expected=0):
        result = subprocess.run([sys.executable, str(INSTALLER), *args], cwd=self.project, text=True, capture_output=True)
        self.assertEqual(result.returncode, expected, (result.stdout, result.stderr))
        return result

    def assert_installed(self):
        folder = self.project / '.agents/skills'
        self.assertEqual({p.name for p in folder.iterdir()}, set(installer.SKILLS))
        for name in installer.SKILLS:
            source = installer.SOURCE / name
            destination = folder / name
            alias = self.project / '.claude/skills' / name
            self.assertTrue(installer.matches(source, destination), name)
            self.assertTrue(installer.matches(source, alias), name)
        self.assertTrue((folder / 'break-ui/CATALOG.md').is_file())
        self.assertTrue((folder / 'i-have-adhd/LICENSE').is_file())

    def test_fresh_install_and_repeat_preserve_resources(self):
        result = self.run_installer()
        self.assertIn(f'all {len(installer.SKILLS)} skills installed and verified', result.stdout)
        self.assert_installed()
        before = installer.fingerprint(self.project)
        result = self.run_installer('--target', str(self.project))
        self.assertIn('Added 0 entries', result.stdout)
        self.assertEqual(installer.fingerprint(self.project), before)

    def test_dry_run_writes_nothing(self):
        result = self.run_installer('--dry-run')
        self.assertIn(f'{len(installer.SKILLS)} skills checked', result.stdout)
        self.assertEqual(list(self.project.iterdir()), [])

    def test_conflicting_skill_stops_before_any_copy(self):
        existing = self.project / '.agents/skills/archify'
        existing.mkdir(parents=True)
        (existing / 'SKILL.md').write_text('A customized existing skill')
        before = installer.fingerprint(self.project)
        result = self.run_installer(expected=2)
        self.assertIn(str(existing), result.stderr)
        self.assertEqual(installer.fingerprint(self.project), before)

    def test_identical_claude_directory_is_retained(self):
        existing = self.project / '.claude/skills/handoff'
        shutil.copytree(installer.SOURCE / 'handoff', existing)
        self.run_installer()
        self.assertFalse(existing.is_symlink())
        self.assert_installed()

    def test_project_folder_pointing_outside_is_rejected(self):
        outside = self.root / 'outside'
        outside.mkdir()
        (self.project / '.agents').mkdir()
        (self.project / '.agents/skills').symlink_to(outside, target_is_directory=True)
        result = self.run_installer(expected=2)
        self.assertIn('outside the project', result.stderr)
        self.assertEqual(list(outside.iterdir()), [])
        self.assertFalse((self.project / '.claude').exists())

    def test_copies_work_when_symlinks_are_unavailable(self):
        with patch.object(Path, 'symlink_to', side_effect=OSError('Symlinks unavailable')):
            with redirect_stdout(io.StringIO()):
                self.assertEqual(installer.install(self.project.resolve(), False), 0)
        self.assert_installed()
        self.assertTrue(all(not p.is_symlink() for p in (self.project / '.claude/skills').iterdir()))

    def test_list_is_complete_and_read_only(self):
        result = self.run_installer('--list')
        self.assertEqual(set(result.stdout.splitlines()), set(installer.SKILLS))
        self.assertEqual(list(self.project.iterdir()), [])

    def test_existing_instruction_bytes_survive_and_default_is_not_duplicated(self):
        originals = {'AGENTS.md': b'# Team rules\r\nKeep approvals.\r\n',
                     'CLAUDE.md': b'# Claude rules\nKeep project workflow.'}
        for filename, content in originals.items():
            (self.project / filename).write_bytes(content)
        self.run_installer()
        for filename, content in originals.items():
            result = (self.project / filename).read_bytes()
            self.assertTrue(result.startswith(content))
            self.assertIn(b'.agents/skills/caveman/SKILL.md', result)
            self.assertIn(b'stop caveman', result)
        before = installer.fingerprint(self.project)
        self.run_installer()
        self.assertEqual(installer.fingerprint(self.project), before)

    def test_claude_md_that_imports_agents_md_gets_no_repeated_defaults(self):
        (self.project / 'CLAUDE.md').write_text('@AGENTS.md\n')
        self.run_installer()
        self.assertEqual((self.project / 'CLAUDE.md').read_text(), '@AGENTS.md\n')
        self.assertIn('stop caveman', (self.project / 'AGENTS.md').read_text())

    def test_fresh_claude_md_only_imports_agents_md(self):
        self.run_installer()
        self.assertEqual((self.project / 'CLAUDE.md').read_text(), '@AGENTS.md\n')
        self.assertEqual((self.project / 'AGENTS.md').read_text().count(installer.CAVEMAN_START), 1)

    def test_ambiguous_instruction_block_stops_before_copying(self):
        (self.project / 'AGENTS.md').write_text(installer.CAVEMAN_START + '\nCustomized rules')
        before = installer.fingerprint(self.project)
        result = self.run_installer(expected=2)
        self.assertIn('instructions need review', result.stderr)
        self.assertEqual(installer.fingerprint(self.project), before)

    def test_existing_caveman_default_gains_quiet_policy_without_being_rewritten(self):
        original = '# Team instructions\n\n' + installer.CAVEMAN_DEFAULT
        (self.project / 'AGENTS.md').write_text(original)
        self.run_installer()
        result = (self.project / 'AGENTS.md').read_text()
        self.assertTrue(result.startswith(original))
        self.assertEqual(result.count(installer.CAVEMAN_START), 1)
        self.assertEqual(result.count(installer.TRAIL_START), 1)
        learning = self.project / installer.QUIET_LEARNING
        self.assertEqual(learning.read_bytes(), installer.QUIET_PREFERENCE.read_bytes())

    def test_existing_learning_is_never_overwritten(self):
        learning = self.project / installer.QUIET_LEARNING
        learning.parent.mkdir(parents=True)
        learning.write_text('# Existing team preference\n')
        before = installer.fingerprint(self.project)
        result = self.run_installer(expected=2)
        self.assertIn('preference was left unchanged', result.stderr)
        self.assertEqual(installer.fingerprint(self.project), before)

    def test_shared_instruction_symlink_is_preserved(self):
        (self.project / 'AGENTS.md').write_text('# Shared instructions\n')
        (self.project / 'CLAUDE.md').symlink_to('AGENTS.md')
        self.run_installer()
        self.assertTrue((self.project / 'CLAUDE.md').is_symlink())
        self.assertEqual((self.project / 'AGENTS.md').read_text().count(installer.CAVEMAN_START), 1)
        self.run_installer()

    def test_codex_override_is_covered_and_new_claude_file_imports_shared_guidance(self):
        override = self.project / 'AGENTS.override.md'
        override.write_text('# Private project overrides\n')
        self.run_installer()
        self.assertTrue(override.read_text().startswith('# Private project overrides\n'))
        self.assertIn('.agents/skills/caveman/SKILL.md', override.read_text())
        self.assertTrue((self.project / 'CLAUDE.md').read_text().startswith('@AGENTS.md\n'))
        before = installer.fingerprint(self.project)
        self.run_installer()
        self.assertEqual(installer.fingerprint(self.project), before)

    def test_external_instruction_symlink_stops_without_touching_external_file(self):
        outside = self.root / 'personal-instructions.md'
        outside.write_text('# Personal rules\n')
        (self.project / 'AGENTS.md').symlink_to(outside)
        before = installer.fingerprint(self.project)
        self.run_installer(expected=2)
        self.assertEqual(outside.read_text(), '# Personal rules\n')
        self.assertEqual(installer.fingerprint(self.project), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
