function isItalic(text: string) : boolean {
  return /^_[a-zA-Z0-9]+_$/.test(text);
}

export { isItalic };