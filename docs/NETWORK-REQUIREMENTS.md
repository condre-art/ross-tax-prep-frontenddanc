# Network Requirements & Port Configuration

## Overview

This document outlines the network port requirements for Ross Tax Prep software to function properly. These requirements ensure secure communication for all tax preparation, e-filing, and client portal operations.

## Required Ports

### TCP 443 (HTTPS) ✅ **PRIMARY - REQUIRED**

**Port 443 outbound is the primary requirement. If TCP 443 is open, 99% of cloud tax software functionality will work.**

This port is used for all secure HTTPS communications and is **required** for the following core functionalities:

#### 1. **Login & Authentication**
- User authentication and authorization
- Multi-factor authentication (MFA) verification
- Session management and token refresh
- OAuth/SAML identity provider communication
- Password reset and account recovery

#### 2. **Data Entry & Save**
- Client information input and updates
- Tax form data entry (Form 1040, schedules, etc.)
- Auto-save functionality
- Real-time data validation
- Draft return storage

#### 3. **E-file Transmission**
- IRS Modernized e-File (MEF) submission
- State e-file transmission
- Electronic signature capture
- Acknowledgment receipt (acceptance/rejection)
- Transmission status tracking
- Return to IRS e-Services system

#### 4. **Licensing & Validation**
- Software license verification
- EFIN (Electronic Filing Identification Number) validation
- ETIN (Electronic Transmitter Identification Number) validation
- PTIN (Preparer Tax Identification Number) verification
- Subscription status checks
- Feature entitlement validation

#### 5. **Document Upload/Download**
- Client document uploads (W-2s, 1099s, receipts)
- Supporting documentation storage
- PDF generation and download
- Tax return PDF exports
- E-file confirmation downloads
- Transcript retrieval

#### 6. **API Calls & Background Services**
- Backend API communication
- Real-time tax calculation
- Bank product integration
- Refund advance processing
- Third-party service integration (credit checks, identity verification)
- Webhook notifications
- Compliance logging and audit trails
- MCP (Model Context Protocol) server communication

### TCP 80 (HTTP) ⚠️ **LEGACY - SOMETIMES USED**

**Port 80 is used for legacy support and edge cases only.**

This port may be required for:

#### 1. **HTTP to HTTPS Redirects**
- Automatic redirect from HTTP to HTTPS
- Ensures users typing `http://` URLs are redirected to secure `https://`
- Browser compatibility fallback

#### 2. **Legacy Update Checks**
- Rare legacy software version checks
- Backwards compatibility with older integrations
- Some third-party service callbacks that haven't been updated to HTTPS

**Note:** Modern installations should primarily rely on TCP 443. Port 80 traffic should automatically redirect to port 443 for security.

## Port Configuration by Environment

### Production Environment
```
Outbound TCP 443 (HTTPS): REQUIRED ✅
Outbound TCP 80 (HTTP): OPTIONAL (for redirects)
```

### Test/Staging Environment
```
Outbound TCP 443 (HTTPS): REQUIRED ✅
Outbound TCP 80 (HTTP): OPTIONAL
```

### Development Environment
```
Outbound TCP 443 (HTTPS): REQUIRED ✅
Outbound TCP 80 (HTTP): OPTIONAL
Inbound TCP 3000 (Next.js dev): LOCAL ONLY
```

## Firewall Configuration

### Recommended Firewall Rules

#### Outbound Rules (Required)
```
Protocol: TCP
Port: 443
Direction: Outbound
Destination: Any (or specific domains below)
Action: Allow
Description: HTTPS for tax software operations
```

#### Outbound Rules (Optional - Legacy Support)
```
Protocol: TCP
Port: 80
Direction: Outbound
Destination: Any
Action: Allow (with redirect to 443)
Description: HTTP redirect to HTTPS
```

### Domain Whitelist (If Using Domain-Based Filtering)

If your firewall requires specific domain whitelisting, ensure the following are accessible:

#### Core Services
- `*.rosstaxprep.com` - Main application domain
- `*.irs.gov` - IRS e-file services and MEF system
- `irs.gov` - IRS resources and validation

#### Third-Party Services
- `*.cloudflare.com` - CDN and edge computing (if using Cloudflare Pages)
- `*.amazonaws.com` - AWS services (if applicable)
- Identity provider domains (if using SSO/OAuth)

#### Optional Services
- Bank product provider APIs (specific domains vary by provider)
- Payment processor domains
- Document storage providers

## Security Best Practices

### 1. **Use HTTPS Only**
- All production traffic should use HTTPS (port 443)
- HTTP (port 80) should redirect to HTTPS
- Enforce TLS 1.2 or higher

### 2. **Certificate Validation**
- Ensure SSL/TLS certificates are valid and not expired
- Use certificates from trusted Certificate Authorities (CA)
- Implement certificate pinning for high-security environments

### 3. **Network Monitoring**
- Monitor outbound traffic to ports 443 and 80
- Log failed connection attempts
- Alert on unusual traffic patterns

### 4. **Proxy Configuration**
If using a corporate proxy:
- Configure proxy settings for HTTPS traffic
- Ensure proxy supports WebSocket connections (if used)
- Test all functionality through proxy before deployment

### 5. **VPN Considerations**
- VPN connections should not block ports 443 or 80
- Test e-file functionality over VPN before tax season
- Document any VPN-specific routing rules

## Troubleshooting

### Common Issues

#### "Cannot Connect to Server" or "Connection Timeout"
**Cause:** Port 443 may be blocked by firewall
**Solution:** 
1. Verify port 443 outbound is open
2. Test connectivity: `curl -v https://www.google.com`
3. Check firewall logs for blocked connections
4. Contact network administrator to allow port 443

#### "E-file Transmission Failed"
**Cause:** Cannot reach IRS e-file servers
**Solution:**
1. Verify connectivity to `*.irs.gov` on port 443
2. Check if IRS e-Services are operational
3. Review e-file logs in admin console
4. Ensure MEF transmission ID generation is working

#### "License Validation Failed"
**Cause:** Cannot reach license validation server
**Solution:**
1. Verify outbound HTTPS access to licensing server
2. Check system clock is accurate (affects SSL/TLS)
3. Verify internet connectivity
4. Check license status in admin panel

#### "Document Upload Fails"
**Cause:** File size or network timeout issues
**Solution:**
1. Check maximum file upload size limits
2. Verify stable connection during upload
3. Try smaller file sizes or compress documents
4. Check for proxy timeout settings

### Testing Connectivity

#### Test HTTPS Connectivity (Port 443)
```bash
# Test basic HTTPS connectivity
curl -v https://www.irs.gov

# Test with specific timeout
curl -v --max-time 30 https://www.irs.gov

# Check SSL certificate
openssl s_client -connect www.irs.gov:443
```

#### Test HTTP Connectivity (Port 80)
```bash
# Test HTTP (should redirect to HTTPS)
curl -v http://www.irs.gov

# Check redirect behavior
curl -I http://www.irs.gov
```

#### Test from Application Server
```bash
# Test from the server running Ross Tax Prep
telnet www.irs.gov 443
# or
nc -zv www.irs.gov 443
```

## Deployment Checklist

Before deploying Ross Tax Prep in a new environment:

- [ ] Verify outbound TCP 443 (HTTPS) is allowed
- [ ] Configure optional outbound TCP 80 (HTTP) for redirects
- [ ] Test connectivity to IRS e-file servers (`*.irs.gov`)
- [ ] Test license validation connectivity
- [ ] Verify SSL/TLS certificate validity
- [ ] Configure proxy settings (if applicable)
- [ ] Test file upload/download functionality
- [ ] Test e-file transmission in test mode
- [ ] Document any custom firewall rules
- [ ] Train staff on connectivity troubleshooting

## Technical Details

### Protocol Stack
- **Application Layer:** HTTPS (HTTP/2, HTTP/1.1)
- **Transport Layer:** TCP
- **Security:** TLS 1.2+ (recommended TLS 1.3)
- **Ports:** 443 (primary), 80 (redirect)

### Connection Types
- **REST API:** HTTPS requests/responses
- **File Uploads:** HTTPS POST with multipart/form-data
- **WebSocket:** WSS (WebSocket Secure) over port 443 (if used for real-time features)
- **Server-Sent Events:** HTTPS long-polling (if used)

### Bandwidth Requirements
- **Typical Usage:** 1-5 Mbps per concurrent user
- **Peak E-file Season:** 10+ Mbps recommended for multiple users
- **Large Document Upload:** Brief spikes up to 50 Mbps

## Compliance Notes

### IRS Requirements
- IRS requires secure transmission (HTTPS) for all e-file submissions
- All MEF (Modernized e-File) transmissions must use encrypted connections
- Port 443 is the standard for IRS e-Services communication

### Data Security
- Tax data is considered Personally Identifiable Information (PII)
- All PII must be transmitted over encrypted channels (HTTPS)
- Port 443 ensures end-to-end encryption for data in transit
- Comply with IRS Publication 1075 for safeguarding tax information

## Support

For network configuration assistance:
1. Review this document thoroughly
2. Test connectivity using commands in Troubleshooting section
3. Contact your network administrator with specific port requirements
4. Refer to IRS e-file provider resources for MEF-specific requirements

## Additional Resources

- [IRS MEF Integration Documentation](./IRS-MEF-INTEGRATION.md)
- [IRS e-file for Software Developers](https://www.irs.gov/e-file-providers/modernized-e-file-mef-for-software-developers)
- [IRS Publication 4164: MEF Guide](https://www.irs.gov/pub/irs-pdf/p4164.pdf)
- [IRS Publication 1075: Tax Information Security Guidelines](https://www.irs.gov/pub/irs-pdf/p1075.pdf)

## Version History

- **v1.0** (2026-02-03): Initial network requirements documentation
  - TCP 443 (HTTPS) as primary requirement
  - TCP 80 (HTTP) for legacy support
  - Comprehensive functionality mapping
  - Troubleshooting guide and testing procedures
