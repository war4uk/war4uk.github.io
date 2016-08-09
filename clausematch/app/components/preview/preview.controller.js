export default class PreviewController {
  getFormattedData() {
    return JSON.stringify({ data: this.lines }, null, 4);
  }
}
