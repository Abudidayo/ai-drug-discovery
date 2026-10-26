# /// script
# requires-python = ">=3.11"
# dependencies = ["oci==2.160.0"]
# ///
"""Provision the fixed Always Free infrastructure and update the registered DuckDNS name."""

import json
import os
import shutil
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

import oci


def main():
    repo = Path(__file__).resolve().parents[2]
    context = repo / ".context/oracle"
    context.mkdir(mode=0o700, parents=True, exist_ok=True)
    identity = dict(
        line.split("=", 1)
        for line in (context / "identity.env").read_text().splitlines()
        if "=" in line
    )
    config = oci.config.from_file(profile_name="HALFLIFE")
    iam = oci.identity.IdentityClient(config)
    subscriptions = iam.list_region_subscriptions(config["tenancy"]).data
    home = next(r.region_name for r in subscriptions if r.is_home_region)
    if config["region"] != home:
        raise RuntimeError("OCI profile must use the home region.")
    terraform = os.environ.get("TERRAFORM_BIN") or shutil.which("terraform")
    if not terraform:
        raise RuntimeError("Install Terraform >=1.9,<2 before provisioning.")
    for name in ("admin_key", "deploy_key"):
        path = context / name
        if not path.exists():
            subprocess.run(
                [
                    "ssh-keygen",
                    "-q",
                    "-t",
                    "ed25519",
                    "-N",
                    "",
                    "-f",
                    str(path),
                    "-C",
                    f"half-life-{name}",
                ],
                check=True,
            )
    variables = {
        "tenancy_ocid": config["tenancy"],
        "region": home,
        "ssh_public_key": (context / "admin_key.pub").read_text().strip(),
        "availability_domain": os.environ.get("OCI_AVAILABILITY_DOMAIN")
        or iam.list_availability_domains(config["tenancy"]).data[0].name,
    }
    previous = context / "outputs.json"
    variable_file = context / "terraform.tfvars.json"
    variable_file.write_text(json.dumps(variables, indent=2) + "\n")
    base = [terraform, f"-chdir={repo / 'deploy/oracle'}"]
    env = {**os.environ, "OCI_CONFIG_FILE_PROFILE": "HALFLIFE"}
    subprocess.run([*base, "init", "-input=false"], env=env, check=True)
    state = json.loads(
        subprocess.check_output([*base, "show", "-json"], env=env, text=True)
    )
    for resource in state.get("values", {}).get("root_module", {}).get("resources", []):
        if resource["address"] == "oci_core_instance.app":
            variables["existing_instance_ocid"] = resource["values"]["id"]
    variable_file.write_text(json.dumps(variables, indent=2) + "\n")
    plan = context / "oracle.tfplan"
    subprocess.run(
        [*base, "plan", "-input=false", f"-var-file={variable_file}", f"-out={plan}"],
        env=env,
        check=True,
    )
    # Capacity errors fail this command. Never switch shape, region or paid plan.
    subprocess.run([*base, "apply", "-input=false", str(plan)], env=env, check=True)
    outputs = subprocess.check_output([*base, "output", "-json"], env=env, text=True)
    previous.write_text(outputs)
    ip = json.loads(outputs)["public_ip"]["value"]
    query = urllib.parse.urlencode(
        {
            "domains": identity["DUCKDNS_SUBDOMAIN"],
            "token": identity["DUCKDNS_TOKEN"],
            "ip": ip,
        }
    )
    try:
        with urllib.request.urlopen(
            f"https://www.duckdns.org/update?{query}", timeout=30
        ) as response:
            if response.read().strip() != b"OK":
                raise RuntimeError("DuckDNS rejected the update.")
    except (OSError, RuntimeError):
        raise RuntimeError(
            "DuckDNS update failed. The VM exists; inspect the registered hostname."
        ) from None
    print(
        f"VM ready at {ip}; DNS updated to {identity['DUCKDNS_SUBDOMAIN']}.duckdns.org."
    )
    print("Verify its SSH host key, then continue with deploy/oracle/README.md.")


if __name__ == "__main__":
    os.umask(0o077)
    main()
