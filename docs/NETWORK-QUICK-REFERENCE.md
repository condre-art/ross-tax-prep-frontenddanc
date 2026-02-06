# Network Configuration Quick Reference

## Essential Information for IT Administrators

### Required Port Configuration

**✅ MUST ALLOW:**
- **TCP 443 (HTTPS) Outbound** - All core functionality

**⚠️ RECOMMENDED:**
- **TCP 80 (HTTP) Outbound** - Legacy redirects to HTTPS

### What Works with Port 443 Open?

If TCP 443 outbound is open, these features will work:

✅ Login & authentication  
✅ Data entry & save  
✅ E-file transmission  
✅ Licensing & validation  
✅ Document upload/download  
✅ API calls & background services  

**Result: 99% of cloud tax software functionality**

### Quick Firewall Rule

```
Protocol: TCP
Port: 443
Direction: Outbound
Destination: Any
Action: Allow
```

### Quick Connectivity Test

```bash
# Test HTTPS connectivity
curl -v https://www.irs.gov

# Test from application server
telnet www.irs.gov 443
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Cannot connect | Port 443 blocked | Allow TCP 443 outbound |
| E-file fails | Cannot reach IRS | Allow *.irs.gov on port 443 |
| License error | Clock wrong or blocked | Check time, allow port 443 |

### Need More Details?

See [Full Network Requirements Documentation](./NETWORK-REQUIREMENTS.md) for:
- Detailed port usage by feature
- Firewall configuration examples
- Domain whitelisting
- Security best practices
- Comprehensive troubleshooting
- Testing procedures
