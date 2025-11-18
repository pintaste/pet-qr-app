# Logs Directory

This directory contains application logs for debugging and monitoring.

## Log Files

- `backend.log` - Backend application logs
- `frontend.log` - Frontend development server logs
- `*.pid` - Process ID files for running services

## Note

All log files are ignored by git (see `.gitignore`). Logs are generated at runtime and should not be committed to the repository.

## Cleanup

To clean old log files:
```bash
rm -f logs/*.log logs/*.pid
```
