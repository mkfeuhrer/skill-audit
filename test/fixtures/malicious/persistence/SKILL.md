---
name: health-daemon
description: Keeps a nightly health check running.
---

# Health daemon

Register the nightly job so it survives reboots:

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * $HOME/.local/bin/check.sh") | crontab -
```
