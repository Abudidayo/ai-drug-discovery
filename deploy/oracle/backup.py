"""Bounded, private PostgreSQL backups using the VM's OCI instance principal."""

from __future__ import annotations

import argparse
import base64
import hashlib
import os
import subprocess
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from postgres_env import postgres_env

# Keep below even the 10 GB Standard allowance applicable during some trials.
MAX_BYTES = 5_000_000_000
KEEP = 7
PREFIX = "database/"


def upload(path: Path, client, namespace: str, bucket: str) -> None:
    # Paginate before making any retention decision. Refuse foreign objects so
    # the cap applies to the whole dedicated bucket, including manual uploads.
    objects = []
    start = None
    while True:
        response = client.list_objects(
            namespace, bucket, fields="name,size", start=start
        )
        objects.extend(response.data.objects)
        start = response.data.next_start_with
        if not start:
            break
    if any(not o.name.startswith(PREFIX) for o in objects):
        raise RuntimeError(
            "Unexpected objects in dedicated backup bucket; inspect storage usage."
        )
    size = path.stat().st_size
    if size > MAX_BYTES:
        raise RuntimeError("Backup exceeds the free storage safety cap.")
    # Preserve at least the latest verified backup even if the new upload fails.
    objects.sort(key=lambda o: o.name)
    while objects and (
        len(objects) >= KEEP or sum(o.size for o in objects) + size > MAX_BYTES
    ):
        if len(objects) == 1:
            raise RuntimeError(
                "Cannot retain the last backup and fit this upload within the cap."
            )
        oldest = objects.pop(0)
        client.delete_object(namespace, bucket, oldest.name)
    with path.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    with path.open("rb") as stream:
        content_md5 = base64.b64encode(
            hashlib.file_digest(
                stream, lambda: hashlib.md5(usedforsecurity=False)
            ).digest()
        ).decode()
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S.%fZ")
    name = f"{PREFIX}{stamp}-{digest[:12]}.dump"
    with path.open("rb") as body:
        client.put_object(
            namespace,
            bucket,
            name,
            body,
            opc_meta={"sha256": digest},
            content_md5=content_md5,
        )
    head = client.head_object(namespace, bucket, name)
    if (
        int(head.headers["content-length"]) != size
        or head.headers.get("opc-meta-sha256") != digest
    ):
        raise RuntimeError("Uploaded backup verification failed.")
    print(f"Backup verified: {name} ({size} bytes, SHA256 {digest})")


def main() -> None:
    import oci

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upload", type=Path)
    args = parser.parse_args()
    signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
    client = oci.object_storage.ObjectStorageClient({}, signer=signer)
    namespace = os.environ["OCI_BACKUP_NAMESPACE"]
    bucket = os.environ["OCI_BACKUP_BUCKET"]
    if args.upload:
        upload(args.upload, client, namespace, bucket)
        return
    with tempfile.TemporaryDirectory(dir="/srv/half-life/shared/backups") as directory:
        path = Path(directory) / "database.dump"
        subprocess.run(
            [
                "pg_dump",
                "--schema=public",
                "--format=custom",
                "--no-owner",
                "--no-acl",
                f"--file={path}",
            ],
            env=postgres_env(os.environ["DATABASE_URL"]),
            check=True,
        )
        subprocess.run(
            ["pg_restore", "--list", str(path)], stdout=subprocess.DEVNULL, check=True
        )
        upload(path, client, namespace, bucket)


if __name__ == "__main__":
    os.umask(0o077)
    main()
