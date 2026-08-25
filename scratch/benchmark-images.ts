async function testImageSizes() {
  const rawUrl = "https://res.cloudinary.com/ilzpeo1g/image/upload/v1785601519/curio-wrap/jwz2o1onnqhedeyscvjn.png";
  const transformedUrl = "https://res.cloudinary.com/ilzpeo1g/image/upload/f_auto,q_auto,w_1000/v1785601519/curio-wrap/jwz2o1onnqhedeyscvjn.png";
  const thumbnailTransformed = "https://res.cloudinary.com/ilzpeo1g/image/upload/f_auto,q_auto,w_400/v1785601519/curio-wrap/jwz2o1onnqhedeyscvjn.png";

  console.log("Fetching raw image...");
  const t0 = performance.now();
  const resRaw = await fetch(rawUrl);
  const bufRaw = await resRaw.arrayBuffer();
  console.log(`Raw URL size: ${(bufRaw.byteLength / 1024).toFixed(1)} KB (took ${(performance.now() - t0).toFixed(0)}ms)`);

  console.log("Fetching transformed image (f_auto,q_auto,w_1000)...");
  const t1 = performance.now();
  const resTrans = await fetch(transformedUrl, { headers: { "Accept": "image/avif,image/webp,image/apng,image/*" } });
  const bufTrans = await resTrans.arrayBuffer();
  console.log(`Transformed URL size: ${(bufTrans.byteLength / 1024).toFixed(1)} KB (took ${(performance.now() - t1).toFixed(0)}ms, Content-Type: ${resTrans.headers.get("content-type")})`);

  console.log("Fetching thumbnail image (f_auto,q_auto,w_400)...");
  const t2 = performance.now();
  const resThumb = await fetch(thumbnailTransformed, { headers: { "Accept": "image/avif,image/webp,image/apng,image/*" } });
  const bufThumb = await resThumb.arrayBuffer();
  console.log(`Thumbnail URL size: ${(bufThumb.byteLength / 1024).toFixed(1)} KB (took ${(performance.now() - t2).toFixed(0)}ms, Content-Type: ${resThumb.headers.get("content-type")})`);
}

testImageSizes().catch(console.error);
