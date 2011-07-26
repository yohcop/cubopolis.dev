
function squaredDistance(x1, y1, x2, y2) {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

function setInArray(ar, x, y, z, val) {
  if (ar.length <= x) {
    ar[x] = [];
  }
  if (ar[x].length <= y) {
    ar[x][y] = [];
  }
  ar[x][y][z] = val;
}

