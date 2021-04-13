# vision-ocr

This is an OCR demo application using Google Cloud Vision.  

<img src="https://raw.githubusercontent.com/takuya-motoshima/vision-ocr/main/screencap/demo.png" width="600">

## Reference

- [Documentation | Google Cloud](https://cloud.google.com/docs?hl=ja)

## Getting Started

Clone the project.

```sh
cd /var/www/html;
git clone https://github.com/takuya-motoshima/vision-ocr.git;
```

Build an OCR API WEB server.  
If you are using Nginx, change the server_name in the configuration file [./documents/vision-ocr.conf](./documents/vision-ocr.conf) and copy it to "/etc/nginx/conf.d/" and restart Nginx.  

```sh
sudo cp -a ./documents/vision-ocr.conf /etc/nginx/conf.d/;
sudo systemctl restart nginx;
```

Copy "credentials.json.sample" to "credentials.json" and set your Google Cloud Vision credentials to "credentials.json".  

Install Node.js and PM2 and start the API.  

```sh
cd /var/www/html/vision-ocr;
npm run start;
```

## Examples

There is a demo application in [./demo](./demo) of this package.  
Copy [./demo/config/config.js.sample](./demo/config/config.js.sample) to ./demo/config/config.js and set the baseUrl of config.js to the base URL of the API you built.  

You can test OCR as soon as you open the demo in your browser.  

https://<Your host name\>/demo

## License

[MIT licensed](./LICENSE.txt)