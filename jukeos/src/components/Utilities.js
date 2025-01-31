export default function selectBestImage(images) {
  const minWidth = 150, minHeight = 150;

  return images.reduce((previous, current) => {
    const validImage
      = current.width >= minWidth && current.height >= minHeight;
    const betterThanPrevious
      = !previous || (current.width < previous.width && current.height < previous.height);

    return (validImage && betterThanPrevious)
      ? current : previous;
  }, null) || images[0];
}
