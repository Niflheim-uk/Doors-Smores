var _nonce:string|undefined;

export function getNonce():string {
  if(_nonce) {
    return _nonce;
  } else {
    _nonce = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      _nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }
	return _nonce;
}
export function clearNonce():void {
  _nonce = undefined;
}
