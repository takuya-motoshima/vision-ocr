# vision-ocr

This is an OCR demo application using Google Cloud Vision.  

Driver's license number check demo:  
<img src="https://raw.githubusercontent.com/takuya-motoshima/vision-ocr/main/docs/drivers-license.png" width="800">

Insurance card number mask demo:  
<img src="https://raw.githubusercontent.com/takuya-motoshima/vision-ocr/main/docs/health-insurance-card.png" width="800">

## Getting Started
Clone the project.
```sh
cd /var/www/html;
git clone https://github.com/takuya-motoshima/vision-ocr.git;
```

Build an OCR API WEB server.  
If you are using Nginx, change the server_name in the configuration file [docs/nginx.conf](docs/nginx.conf) and copy it to "/etc/nginx/conf.d/" and restart Nginx.  
```sh
sudo cp -a docs/nginx.conf /etc/nginx/conf.d/example.conf;
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
Copy [./demo/config.js.sample](./demo/config.js.sample) to ./demo/config.js and set the baseUrl of config.js to the base URL of the API you built.  

You can test OCR as soon as you open the demo in your browser.  

https://<Your host name\>/demo

## Reference
- [Documentation | Google Cloud](https://cloud.google.com/docs?hl=ja)
- [OCR your driver's license](https://qiita.com/shoku-pan/items/39747eddcf2bc19b48d7)

## License
[MIT licensed](./LICENSE.txt)