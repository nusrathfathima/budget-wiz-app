function createFramesPaths(snapshot, path = []) {
  const paths = snapshot.crossFramesXPaths
    ? snapshot.crossFramesXPaths.map(selector => ({
        path: path.concat(selector),
        parentSnapshot: snapshot,
      }))
    : []

  for (const frame of snapshot.frames) {
    if (frame.selector) {
      paths.push(...createFramesPaths(frame, path.concat(frame.selector)))
    }
  }

  delete snapshot.selector
  delete snapshot.crossFramesXPaths

  return paths
}

module.exports = createFramesPaths
