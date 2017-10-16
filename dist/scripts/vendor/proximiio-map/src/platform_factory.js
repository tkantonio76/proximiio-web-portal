import Platform from './platforms/platform';
import AndroidPlatform from './platforms/android';
import IosPlatform from './platforms/ios';

class PlatformFactory {

  static isAndroid() {
    return typeof Android !== 'undefined';
  }

  static isIos() {
    return typeof window.webkit !== 'undefined' &&
           typeof window.webkit.messageHandlers !== 'undefined';
  }

  static getPlatform(window, document) {
    console.log(`PlatformFactory: isAndroid:${this.isAndroid()} isIos:${this.isIos()}`);
    if (this.isAndroid()) {
      return new AndroidPlatform(window, document);
    }

    if (this.isIos()) {
      return new IosPlatform(window, document);
    }

    return new Platform(window);
  }

}

export default PlatformFactory;
