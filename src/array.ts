declare global {
  interface Array<T> {
    sample: () => T;
    shuffle: () => Array<T>;
  }
}

Array.prototype.sample = function () {
  return this[Math.floor(Math.random() * this.length)];
};

Array.prototype.shuffle = function () {
  let currentIndex: number = this.length,
    randomIndex: number;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex],
      this[currentIndex],
    ];
  }

  return this;
};

export {};
