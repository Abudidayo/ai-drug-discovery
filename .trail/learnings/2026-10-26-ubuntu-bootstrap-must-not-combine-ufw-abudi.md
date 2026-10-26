---
title: Ubuntu bootstrap must not combine UFW and iptables-persistent
author: Abudi
date: 2026-10-26
branch: fix-network-persist-flake
id: l-382c2565
scope: repo
status: active
src: agent
touches:
  - scripts/oracle/bootstrap.sh
  - scripts/tests/test_oracle.py
---

## Decided
scripts/oracle/bootstrap.sh uses iptables-persistent alone, with one HALF-LIFE-IN chain for IPv4 and IPv6. It permits loopback, established connections, required ICMP, and TCP 22/80/443, rejects other inbound traffic, and preserves OCI's existing OUTPUT/metadata rules.

## Tried and ruled out
Ubuntu 24.04 apt simulation rejected installing ufw and iptables-persistent together because ufw declares a package conflict. Removing ufw from the requested package set made the same simulation succeed.

## Watch out
Keep the final REJECT in the new chain before inserting its INPUT jump. scripts/tests/test_oracle.py exercises the exact firewall block with command doubles, verifying both families, allowed ports and egress preservation.
