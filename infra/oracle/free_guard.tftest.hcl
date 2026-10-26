mock_provider "oci" {
  mock_data "oci_identity_tenancy" { defaults = { home_region_key = "LHR" } }
  mock_data "oci_identity_regions" { defaults = { regions = [{ name = "uk-london-1", key = "LHR" }] } }
  mock_data "oci_identity_compartments" { defaults = { compartments = [] } }
  mock_data "oci_identity_availability_domains" { defaults = { availability_domains = [{ name = "AD-1" }] } }
  mock_data "oci_core_instances" { defaults = { instances = [] } }
  mock_data "oci_core_volumes" { defaults = { volumes = [] } }
  mock_data "oci_core_boot_volumes" { defaults = { boot_volumes = [] } }
  mock_data "oci_objectstorage_bucket_summaries" { defaults = { bucket_summaries = [] } }
  mock_data "oci_core_images" { defaults = { images = [{ id = "test-image" }] } }
  mock_data "oci_core_vnic_attachments" { defaults = { vnic_attachments = [{ vnic_id = "test-vnic" }] } }
  mock_data "oci_core_private_ips" { defaults = { private_ips = [{ id = "test-private-ip" }] } }
}
variables {
  tenancy_ocid        = "test-tenancy"
  region              = "uk-london-1"
  availability_domain = "AD-1"
  ssh_public_key      = "ssh-ed25519 test"
}
run "free_shape" {
  command = plan
  assert {
    condition     = oci_core_instance.app.shape == "VM.Standard.A1.Flex" && oci_core_instance.app.shape_config[0].ocpus == 2 && oci_core_instance.app.shape_config[0].memory_in_gbs == 12 && oci_core_instance.app.source_details[0].boot_volume_size_in_gbs == "100"
    error_message = "Only the requested 2 OCPU, 12 GB ARM VM with a 100 GB disk is allowed."
  }
}
run "wrong_region" {
  command = plan
  variables { region = "eu-frankfurt-1" }
  expect_failures = [terraform_data.free_guard]
}
run "occupied_compute_allowance" {
  command = plan
  override_data {
    target = data.oci_core_instances.existing["test-tenancy"]
    values = { instances = [{ shape = "VM.Standard.A1.Flex", display_name = "another-app", state = "RUNNING", shape_config = [{ ocpus = 1, memory_in_gbs = 6 }] }] }
  }
  expect_failures = [terraform_data.free_guard]
}
run "occupied_disk_allowance" {
  command = plan
  override_data {
    target = data.oci_core_volumes.existing["test-tenancy"]
    values = { volumes = [{ size_in_gbs = "150", state = "AVAILABLE" }] }
  }
  expect_failures = [terraform_data.free_guard]
}
run "shared_object_storage" {
  command = plan
  override_data {
    target = data.oci_objectstorage_bucket_summaries.existing["test-tenancy"]
    values = { bucket_summaries = [{ name = "other-data" }] }
  }
  expect_failures = [terraform_data.free_guard]
}

run "untracked_instance_with_matching_name" {
  command = plan
  override_data {
    target = data.oci_core_instances.existing["test-tenancy"]
    values = { instances = [{ id = "untracked-instance", shape = "VM.Standard.A1.Flex", display_name = "half-life", state = "RUNNING", shape_config = [{ ocpus = 2, memory_in_gbs = 12 }] }] }
  }
  expect_failures = [terraform_data.free_guard]
}
