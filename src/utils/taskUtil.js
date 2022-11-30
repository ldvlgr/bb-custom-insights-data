
const PLUGIN_NAME = 'CustomInsightsDataPlugin';

  // Adds these task.attributes
  // conversations":{"followed_by":"Transfer to Queue","destination":"<queue name>"} or
  // conversations":{"followed_by":"Transfer to Agent"}
export const updateConversations = async (task, conversationsData = {}) => {
  let newAttributes = { ...task.attributes };
  let conversations = task.attributes.conversations;
  let newConv = {};
  if (conversations) {
    newConv = { ...conversations };
  }
  let convAttributes = Object.keys(conversationsData);
  if (convAttributes.length > 0) {
    for (const attr of convAttributes) {
      newConv[attr] = conversationsData[attr];
    }
    newAttributes.conversations = newConv;
    console.log(PLUGIN_NAME, 'Updating task with new attributes:', newAttributes);
    await task.setAttributes(newAttributes);
  }
}

export const resetConversations = async (task) => {
  //Transfers and Hold Count - only remove if there was a transfer
  let newAttributes = { ...task.attributes };
  if (newAttributes?.conversations?.followed_by) {
    delete newAttributes.conversations.followed_by;
    delete newAttributes.conversations.destination;
    delete newAttributes.conversations[HOLD_COUNT_PROP];
    console.log(PLUGIN_NAME, 'Updating task with new attributes:', newAttributes);
    await task.setAttributes(newAttributes);
  }
}
