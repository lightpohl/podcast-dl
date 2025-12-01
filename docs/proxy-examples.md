# Proxy Examples

These examples show how to configure `podcast-dl` to use an existing proxy server. You must have a proxy server running and accessible before using these configurations. Proxies route traffic through a different IP address/network, commonly used for corporate networks, VPNs, or accessing region-restricted content.

## VPN Alternative

The simplest alternative is to use a VPN. Once your VPN is connected, `podcast-dl` will automatically route traffic through the VPN's network without requiring any proxy configuration.

## HTTP Proxy

```bash
export GLOBAL_AGENT_HTTP_PROXY="http://127.0.0.1:12345"
podcast-dl --proxy --url "https://example.com/podcast.rss"
```

## HTTPS Proxy

```bash
export GLOBAL_AGENT_HTTPS_PROXY="http://127.0.0.1:12345"
podcast-dl --proxy --url "https://example.com/podcast.rss"
```

**Note:** The proxy URL must use the `http://` protocol, even for HTTPS proxies. The proxy server handles the HTTPS connection.

## Both HTTP and HTTPS Proxy

```bash
export GLOBAL_AGENT_HTTP_PROXY="http://127.0.0.1:12345"
export GLOBAL_AGENT_HTTPS_PROXY="http://127.0.0.1:12345"
podcast-dl --proxy --url "https://example.com/podcast.rss"
```

## Proxy with Authentication

```bash
export GLOBAL_AGENT_HTTP_PROXY="http://username:password@127.0.0.1:12345"
podcast-dl --proxy --url "https://example.com/podcast.rss"
```

## Single Command (No Export)

```bash
GLOBAL_AGENT_HTTP_PROXY="http://127.0.0.1:12345" podcast-dl --proxy --url "https://example.com/podcast.rss"
```
