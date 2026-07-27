// Camera barcode scanner.
// Uses the native BarcodeDetector API where available (Chrome, Edge,
// Android WebView); falls back to ZXing loaded from a CDN elsewhere
// (Safari, Firefox). Requires a secure context (https or localhost).

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
const ZXING_CDN = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';

export class BarcodeScanner {
  /**
   * @param {HTMLVideoElement} video
   * @param {(code: string) => void} onDetect
   * @param {(message: string) => void} onStatus
   */
  constructor(video, onDetect, onStatus) {
    this.video = video;
    this.onDetect = onDetect;
    this.onStatus = onStatus;
    this.stream = null;
    this.running = false;
    this._loopId = null;
    this._zxingReader = null;
    this._zxingControls = null;
  }

  get active() {
    return this.running;
  }

  async start() {
    if (this.running) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera not supported in this browser. You can still type barcodes manually.');
    }
    if (!window.isSecureContext) {
      throw new Error('Camera needs a secure context — open the app over https or localhost.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    this.running = true;

    if ('BarcodeDetector' in window) {
      this.onStatus('Scanning… center the barcode in the frame');
      this._runNativeLoop();
    } else {
      this.onStatus('Loading barcode decoder…');
      await this._runZXing();
    }
  }

  _runNativeLoop() {
    const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
    const tick = async () => {
      if (!this.running) return;
      try {
        if (this.video.readyState >= 2) {
          const codes = await detector.detect(this.video);
          if (codes.length > 0 && this.running) {
            this._handleDetect(codes[0].rawValue);
            return;
          }
        }
      } catch {
        // Ignore transient frame decode errors and keep scanning.
      }
      this._loopId = setTimeout(tick, 180);
    };
    tick();
  }

  async _runZXing() {
    let zxing;
    try {
      zxing = await import(/* @vite-ignore */ ZXING_CDN);
    } catch {
      throw new Error('Could not load the barcode decoder (offline?). You can still type barcodes manually.');
    }
    if (!this.running) return;
    this._zxingReader = new zxing.BrowserMultiFormatReader();
    this.onStatus('Scanning… center the barcode in the frame');
    this._zxingControls = await this._zxingReader.decodeFromVideoElement(
      this.video,
      (result) => {
        if (result && this.running) this._handleDetect(result.getText());
      }
    );
  }

  _handleDetect(code) {
    // Pause scanning while the result is handled; caller restarts if needed.
    this.stop();
    if (navigator.vibrate) navigator.vibrate(80);
    this.onDetect(code);
  }

  stop() {
    this.running = false;
    if (this._loopId) {
      clearTimeout(this._loopId);
      this._loopId = null;
    }
    if (this._zxingControls) {
      this._zxingControls.stop();
      this._zxingControls = null;
    }
    this._zxingReader = null;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
  }
}
