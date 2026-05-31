// Stub for Howler.js — prevents actual audio loading/playback in unit tests.
window.Howl = function (config) {
    this._config = config || {};
    this._playing = false;
};
window.Howl.prototype.play  = function () {
    this._playing = true;
    if (this._config.onplay) { this._config.onplay(); }
    return this;
};
window.Howl.prototype.pause = function () {
    this._playing = false;
    if (this._config.onpause) { this._config.onpause(); }
    return this;
};
window.Howl.prototype.stop  = function () {
    this._playing = false;
    if (this._config.onstop) { this._config.onstop(); }
    return this;
};
window.Howl.prototype.unload  = function () { return this; };
window.Howl.prototype.playing = function () { return this._playing; };
