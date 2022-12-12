import { Manager } from '@twilio/flex-ui';
import { updateConversations } from '../utils/taskUtil';
import { getQueueElements } from '../utils/queueUtil';
import { getMessageCounts } from '../utils/chatUtil';

const CALL_SID_LABEL_PROP = 'conversation_label_9';
const CONFERENCE_SID_LABEL_PROP = 'conversation_label_10';
const CUSTOMER = 'Customer';
const AGENT = 'Agent';
let _manager = Manager.getInstance();

const PLUGIN_NAME = 'CustomInsightsDataPlugin';

export default (manager) => {
  manager.workerClient.on("reservationCreated", async reservation => {
    //Reservation scope
    if (reservation.task.taskChannelUniqueName == 'voice') {
      reservation.on("wrapup", async (reservation) => {
        console.log(PLUGIN_NAME, 'Reservation wrapup', reservation);
        let convoData = {};
        //Check if hang_up_by is already set due to Agent invoking Hangup
        let hu = reservation.task.attributes?.conversations?.hang_up_by;
        if (!hu) convoData = { hang_up_by: CUSTOMER };

        const queueElem = getQueueElements(reservation.task.queueName);
        if (queueElem) {
          convoData.conversation_attribute_4 = queueElem.pillar;
          convoData.conversation_attribute_5 = queueElem.product;
        }
        let callSid = reservation.task.attributes?.conference?.participants?.customer;
        let confSid = reservation.task.attributes?.conference?.sid;
        if (callSid && confSid) {
          convoData[CALL_SID_LABEL_PROP] = callSid;
          convoData[CONFERENCE_SID_LABEL_PROP] = confSid;
        }
        await updateConversations(reservation.task, convoData);
      });

    } else {
      //Chat
      reservation.on('accepted', async (reservation) => {
        console.log(PLUGIN_NAME, 'Reservation Accepted: ', reservation);

        // https://media.twiliocdn.com/sdk/js/chat/releases/3.2.4/docs/Client.html#event:channelAdded
        // Fired when a Channel becomes visible to the Client. 
        // Fired for created and not joined private channels and for all type of channels Client has joined or invited to.
        manager.chatClient.on("channelAdded", async (channel) => {
          console.log(PLUGIN_NAME, 'Channel Added.');
          //let workerName = manager.workerClient.name;  //name has @ etc
          const identity = manager.workerClient.attributes.contact_uri.replace('client:', '');
          channel.on('memberLeft', async (member) => {
            console.log(PLUGIN_NAME, member.identity, 'left the chat');
            if (member.identity == identity) {
              await updateConversations(reservation.task, { hang_up_by: AGENT });
            } else {
              await updateConversations(reservation.task, { hang_up_by: CUSTOMER });
            }
          });

        });
      });

      reservation.on('wrapup', async (reservation) => {
        console.log(PLUGIN_NAME, 'Reservation WrapUp: ', reservation);
        if (!reservation.task.attributes?.conversations[MSG_COUNT_PROP]) {
          const channelSid = reservation.task.attributes.channelSid;
          const msgCounts = getMessageCounts(channelSid);
          const queueElem = getQueueElements(reservation.task.queueName);
          if (queueElem) {
            msgCounts.conversation_attribute_4 = queueElem.pillar;
            msgCounts.conversation_attribute_5 = queueElem.product;
          }
          await updateConversations(reservation.task, msgCounts);
        };
      });
    }
  });
}