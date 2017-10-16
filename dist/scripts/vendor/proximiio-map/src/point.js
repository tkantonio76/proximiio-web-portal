class Point {

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  get json() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  static fromLeafletPoint(point) {
    return new Point(point.x, point.y);
  }

}

export default Point;
