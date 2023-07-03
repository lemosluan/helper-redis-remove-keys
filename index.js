const Redis = require('ioredis');

const redis_host = "host";
const redis_pass = "pass";
const redis_port = 6380;

const redis = new Redis({
  host: redis_host,
  port: redis_port,
  password: redis_pass,
  ...(redis_port == 6380 ? { tls: { servername: redis_host } } : {}),
});

function visitAllKeys(match) {
  const stream = redis.scanStream({ match, count: 100 });
  stream.on("data", function (resultKeys) {
    for (let i = 0; i < resultKeys.length; i++) {
      console.log(resultKeys[i]);
    }
  });
  stream.on("end", function () {
    console.log("all keys have been visited");
  });
}

function deleteKeysMatch(match) {
  const stream = redis.scanStream({ match, count: 100 });
  let pipeline = redis.pipeline();
  const localKeys = [];

  stream.on("data", (resultKeys) => {
    for (let i = 0; i < resultKeys.length; i++) {
      localKeys.push(resultKeys[i]);
      pipeline.del(resultKeys[i]);
    }
    console.log("Data Received", localKeys.length);
    if (localKeys.length > 100) {
      pipeline.exec(() => {
        console.log("one batch delete complete");
      });
      localKeys.length = 0;
      pipeline = redis.pipeline();
    }
  });

  stream.on("end", () => {
    pipeline.exec(() => {
      console.log("final batch delete complete");
    });
  });

  stream.on("error", (err) => {
    console.log("error", err);
  });
}

visitAllKeys("38e56a79*");
deleteKeysMatch("*");
