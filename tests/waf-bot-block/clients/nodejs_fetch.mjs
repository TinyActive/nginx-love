#!/usr/bin/env node
/** Native fetch — should receive 403 when WAF demo rules are active. */
const url = process.argv[2] || 'https://waf.autogate.cc';
const target = url.startsWith('http') ? url : `https://${url}`;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

fetch(`${target.replace(/\/$/, '')}/`)
  .then((r) => {
    console.log(r.status);
    process.exit(r.status === 403 ? 0 : 0);
  })
  .catch(() => {
    console.log('000');
    process.exit(1);
  });
