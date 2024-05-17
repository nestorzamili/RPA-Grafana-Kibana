# RPA-Grafana-Kibana

This project utilizes several tools to automate data retrieval from the web and report delivery via WhatsApp API.

## Tools Used

1. **UiPath**: Used for triggering, scheduling, and sending reports to WhatsApp.
2. **Node.js**: Used as the main platform to run JavaScript scripts.
3. **Puppeteer**: Used in Node.js to access and interact with web pages.
4. **Tesseract.js**: Used in Node.js for OCR (Optical Character Recognition) on images taken from the web.
5. **WhatsApp-Web-JS**: Used in UiPath to send reports to WhatsApp. You can find more details [here](https://github.com/nestorzamili/WhatsApp-Web-JS.git).

## How to Run the Project

### Node.js

1. **Clone the repository**: First, you need to clone the repository to your local machine. You can do this with the following command:

```bash
git clone https://github.com/nestorzamili/RPA-Grafana-Kibana.git
```
2. **Navigate to the project directory**: Use the command line to navigate into the directory of the project. For example:
```bash
cd RPA-Grafana-Kibana
```
3. ***Install the dependencies***: The project uses several Node.js libraries. You can install them with the following command:
```bash
npm install
```

### UiPath Studio

Open UiPath Studio, then click on "Open a Local Project". Navigate to and open the `project.json` file located in this project's folder. After the project has finished loading, you can run it by clicking on "Run" or "Run File".

## License

This project is licensed under the terms of the license provided in the [LICENSE](LICENCE) file.