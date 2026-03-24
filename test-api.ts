import { getSignupImages } from './src/lib/showcase-cache';
async function test() {
  const items = await getSignupImages();
  console.log('Result length:', items?.length);
  if (items?.length === 0) {
     console.log('Array is empty!');
  }
}
test();
