# vision-ocr

This is a demo of OCR using Google Cloud Vision.

## Reference

[Documentation | Google Cloud](https://cloud.google.com/docs?hl=ja)

## Getting Started

### How to build API.

Clone this application.

```sh
cd /var/www/html;
git clone https://github.com/takuya-motoshima/vision-ocr.git;
```

Install Nginx and add the WEB settings for this application to "/etc/nginx/conf.d/vision-ocr.conf".  
Enter your hostname in <API server host name>.

```nginx
upstream vision-ocr-upstream {
  #ip_hash;
  server 127.0.0.1:3001;
  #keepalive 64;
}
server {
  listen 80;
  server_name <API server host name>;
  charset UTF-8;
  access_log /var/log/nginx/access.log main;
  error_log /var/log/nginx/error.log  warn;

  # Hide PHP version and web server software name
  server_tokens off;
  # more_clear_headers X-Powered-By;
  # more_clear_headers Server;

  # Proxy to nodejs app
  location / {
    #proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;

    # Buffering
    client_max_body_size 100m;
    client_body_buffer_size 100m;
    proxy_buffers 8 10m;
    proxy_buffer_size 10m;
    proxy_busy_buffers_size 10m;

    # Disable caching
    set $do_not_cache 1;
    proxy_no_cache $do_not_cache;
    proxy_cache_bypass $do_not_cache;
    sendfile off;

    # Enable WebSockets
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Send a request to an Express application
    proxy_redirect off;
    proxy_read_timeout 1m;
    proxy_connect_timeout 1m;
    proxy_pass http://vision-ocr-upstream;
  }
}
```

After saving the settings, restart the WEB server.

```sh
sudo systemctl restart nginx;
```

Change the Google Cloud credentials.  
Change "credentials.example.json" to "credentials.json" and set the credentials downloaded from Cloud Vision.  

Launch the application.  

```sh
cd /var/www/html;
npm run start;
```

### How to use the demo.

Set the URL of the OCR API that the demo connects to in "./demo/config/config.js".  

./demo/config/config.js:  

```js
export const baseUrl = 'https://<API server host name>/api';
```

Next, prepare a WEB server to open the demo with a browser.  

When you're ready, open the demo from the URL below.  

https://<Hostname with the demo page>/demo