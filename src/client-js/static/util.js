
function squaredDistance(x1, y1, x2, y2) {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

function setInArray(ar, x, y, z, val) {
  if (ar.length <= y) {
    ar[y] = [];
  }
  if (ar[y].length <= x) {
    ar[y][x] = [];
  }
  ar[y][x][z] = val;
}

