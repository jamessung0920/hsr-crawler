import util from 'util';

const delay = util.promisify(setTimeout);

async function retry(fn, retryDelay = 1000, numRetries = 3) {
  for (let i = 0; i <= numRetries; i++) {
    if (i !== 0) console.log('retry...');
    try {
      console.log(111);
      await fn();
      console.log(222);
      return;
    } catch (e) {
      console.log(e);
      if (i === numRetries) throw e;
      await delay(retryDelay);
      retryDelay = retryDelay * 2;
    }
  }
}

export default retry;
