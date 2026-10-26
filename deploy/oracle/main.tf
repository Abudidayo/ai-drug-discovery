terraform {
  required_version = ">= 1.9, < 2.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 7.0"
    }
  }
}

variable "tenancy_ocid" { type = string }
variable "region" { type = string }
variable "ssh_public_key" { type = string }
variable "existing_instance_ocid" {
  type        = string
  default     = ""
  description = "After the first apply, set to the instance_ocid output. Untracked A1 instances are never excluded from allocation checks."
}
variable "availability_domain" {
  type        = string
  description = "An availability domain in the home region. No paid shape fallback is used."
}

provider "oci" { region = var.region }

data "oci_identity_tenancy" "account" { tenancy_id = var.tenancy_ocid }
data "oci_identity_regions" "all" {}
data "oci_identity_compartments" "all" {
  compartment_id            = var.tenancy_ocid
  compartment_id_in_subtree = true
  access_level              = "ANY"
  state                     = "ACTIVE"
}
locals {
  compartments = toset(concat([var.tenancy_ocid], data.oci_identity_compartments.all.compartments[*].id))
  home_region  = one([for r in data.oci_identity_regions.all.regions : r.name if r.key == data.oci_identity_tenancy.account.home_region_key])
}
data "oci_core_instances" "existing" {
  for_each       = local.compartments
  compartment_id = each.value
}
data "oci_core_volumes" "existing" {
  for_each       = local.compartments
  compartment_id = each.value
}
data "oci_identity_availability_domains" "all" { compartment_id = var.tenancy_ocid }
locals {
  boot_scopes  = { for pair in setproduct(local.compartments, toset(data.oci_identity_availability_domains.all.availability_domains[*].name)) : "${pair[0]}:${pair[1]}" => pair }
  instances    = flatten([for c in data.oci_core_instances.existing : c.instances])
  existing_app = anytrue([for i in local.instances : i.id == var.existing_instance_ocid && i.state != "TERMINATED"])
}
data "oci_core_boot_volumes" "existing" {
  for_each            = local.boot_scopes
  compartment_id      = each.value[0]
  availability_domain = each.value[1]
}
data "oci_objectstorage_namespace" "account" { compartment_id = var.tenancy_ocid }
data "oci_objectstorage_bucket_summaries" "existing" {
  for_each       = local.compartments
  compartment_id = each.value
  namespace      = data.oci_objectstorage_namespace.account.namespace
}
resource "terraform_data" "free_guard" {
  lifecycle {
    precondition {
      condition     = var.region == local.home_region
      error_message = "Always Free must use the tenancy home region."
    }
    precondition {
      condition     = alltrue([for i in local.instances : i.shape != "VM.Standard.A1.Flex" || i.state == "TERMINATED" || (i.id == var.existing_instance_ocid && i.shape_config[0].ocpus == 2 && i.shape_config[0].memory_in_gbs == 12)])
      error_message = "Another A1 allocation exists. Stop and inspect the tenancy's free allowance."
    }
    precondition {
      condition     = sum(concat([0], [for v in flatten([for c in data.oci_core_volumes.existing : c.volumes]) : v.size_in_gbs if v.state != "TERMINATED"], [for v in flatten([for c in data.oci_core_boot_volumes.existing : c.boot_volumes]) : v.size_in_gbs if v.state != "TERMINATED"])) + (local.existing_app ? 0 : 100) <= 200
      error_message = "The proposed boot disk would exceed 200 GB of tenancy block storage."
    }
    precondition {
      condition     = alltrue([for b in flatten([for c in data.oci_objectstorage_bucket_summaries.existing : c.bucket_summaries]) : b.name == "half-life-backups"])
      error_message = "Other buckets exist. Use a dedicated free account or audit shared storage before proceeding."
    }
  }
}
resource "oci_identity_compartment" "app" {
  compartment_id = var.tenancy_ocid
  name           = "half-life"
  description    = "HalfLife Always Free hosting"
  enable_delete  = false
  depends_on     = [terraform_data.free_guard]
}
resource "oci_core_vcn" "app" {
  compartment_id = oci_identity_compartment.app.id
  cidr_block     = "10.42.0.0/16"
  display_name   = "half-life"
}
resource "oci_core_internet_gateway" "app" {
  compartment_id = oci_identity_compartment.app.id
  vcn_id         = oci_core_vcn.app.id
  enabled        = true
}
resource "oci_core_route_table" "app" {
  compartment_id = oci_identity_compartment.app.id
  vcn_id         = oci_core_vcn.app.id
  route_rules {
    network_entity_id = oci_core_internet_gateway.app.id
    destination       = "0.0.0.0/0"
  }
}
resource "oci_core_security_list" "app" {
  compartment_id = oci_identity_compartment.app.id
  vcn_id         = oci_core_vcn.app.id
  dynamic "ingress_security_rules" {
    for_each = toset([22, 80, 443])
    content {
      protocol = "6"
      source   = "0.0.0.0/0"
      tcp_options {
        min = ingress_security_rules.value
        max = ingress_security_rules.value
      }
    }
  }
  # Path MTU discovery, without exposing another application port.
  ingress_security_rules {
    protocol = "1"
    source   = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
  }
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}
resource "oci_core_subnet" "app" {
  compartment_id    = oci_identity_compartment.app.id
  vcn_id            = oci_core_vcn.app.id
  cidr_block        = "10.42.1.0/24"
  route_table_id    = oci_core_route_table.app.id
  security_list_ids = [oci_core_security_list.app.id]
}
data "oci_core_images" "ubuntu" {
  compartment_id           = var.tenancy_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}
resource "oci_core_instance" "app" {
  compartment_id      = oci_identity_compartment.app.id
  availability_domain = var.availability_domain
  display_name        = "half-life"
  shape               = "VM.Standard.A1.Flex"
  shape_config {
    ocpus         = 2
    memory_in_gbs = 12
  }
  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = 100
    boot_volume_vpus_per_gb = 10
  }
  create_vnic_details {
    subnet_id        = oci_core_subnet.app.id
    assign_public_ip = false
  }
  metadata = { ssh_authorized_keys = var.ssh_public_key }
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [source_details[0].source_id]
  }
}
data "oci_core_vnic_attachments" "app" {
  compartment_id = oci_identity_compartment.app.id
  instance_id    = oci_core_instance.app.id
}
data "oci_core_private_ips" "app" { vnic_id = data.oci_core_vnic_attachments.app.vnic_attachments[0].vnic_id }
resource "oci_core_public_ip" "app" {
  compartment_id = oci_identity_compartment.app.id
  lifetime       = "RESERVED"
  private_ip_id  = data.oci_core_private_ips.app.private_ips[0].id
}
resource "oci_objectstorage_bucket" "backups" {
  compartment_id = oci_identity_compartment.app.id
  namespace      = data.oci_objectstorage_namespace.account.namespace
  name           = "half-life-backups"
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"
  versioning     = "Disabled"
  auto_tiering   = "Disabled"
  lifecycle { prevent_destroy = true }
}
resource "oci_identity_dynamic_group" "app" {
  compartment_id = var.tenancy_ocid
  name           = "half-life-backup"
  description    = "Only the HalfLife VM"
  matching_rule  = "ALL {instance.id = '${oci_core_instance.app.id}'}"
}
resource "oci_identity_policy" "backup" {
  compartment_id = var.tenancy_ocid
  name           = "half-life-backup"
  description    = "VM backup access to one private bucket"
  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.app.name} to manage objects in compartment id ${oci_identity_compartment.app.id} where target.bucket.name = '${oci_objectstorage_bucket.backups.name}'"
  ]
}
output "public_ip" { value = oci_core_public_ip.app.ip_address }
output "instance_ocid" { value = oci_core_instance.app.id }
output "backup_namespace" { value = data.oci_objectstorage_namespace.account.namespace }
output "backup_bucket" { value = oci_objectstorage_bucket.backups.name }
