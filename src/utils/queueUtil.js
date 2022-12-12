
const PLUGIN_NAME = 'CustomInsightsDataPlugin';
let queues = undefined;

export const getQueues = (manager) => new Promise(async (resolve) => {
  if (!queues) {
    const query = await manager.insightsClient.instantQuery('tr-queue');
    query.on('searchResult', (items) => {
      console.log(PLUGIN_NAME, 'Storing queues once', items);
      queues = items;
      resolve(items);
    });
    query.search('');
  } else {
    resolve(queues);
  }
});

export const getQueueElements = (queue) => {
  let queueElem = undefined;
  const queueNameComponents = queue.split('.');
  // Assumption: if the queue name contains two '.', the format is "BPO.pillar.program"
  if (queueNameComponents && queueNameComponents.length == 3) {
    queueElem = { pillar: queueNameComponents[1], product: queueNameComponents[2] };
  }
  return queueElem;
}
