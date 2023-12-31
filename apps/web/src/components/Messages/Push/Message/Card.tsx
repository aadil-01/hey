import type { IMessageIPFS } from '@pushprotocol/restapi';

import { ArrowUturnLeftIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { MessageType } from '@pushprotocol/restapi/src/lib/constants';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import usePushHooks from 'src/hooks/messaging/push/usePush';
import useProfileStore from 'src/store/persisted/useProfileStore';
import { usePushChatStore } from 'src/store/persisted/usePushChatStore';

import type { MessageReactions } from '../Actions/Reactions';

import { ChatAction } from '../Actions/ChatAction';
import { DisplayReactions, Reactions } from '../Actions/Reactions';
import { getProfileIdFromDID } from '../helper';
import Attachment from './Attachment';
import TimeStamp from './TimeStamp';
import { MessageWrapper } from './Wrapper';

interface Props {
  message: IMessageIPFS;
  messageReactions: [] | MessageReactions[];
  replyMessage: IMessageIPFS | null;
}

export enum MessageOrigin {
  Receiver = 'receiver',
  Sender = 'sender'
}

interface MessageCardProps {
  chat: IMessageIPFS;
  className: string;
}

const MessageCard: React.FC<MessageCardProps> = ({ chat, className }) => {
  return <p className={className}>{chat.messageContent}</p>;
};

const Message = ({ message, messageReactions, replyMessage }: Props) => {
  const [showChatActions, setShowChatActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const currentProfile = useProfileStore((state) => state.currentProfile);
  const recipientProfile = usePushChatStore((state) => state.recipientProfile);
  const reactionRef = useRef<HTMLDivElement | null>(null);
  const { useSendMessage } = usePushHooks();
  const { setReplyToMessage } = usePushChatStore();
  const { mutateAsync: sendMessage } = useSendMessage();

  const handleMouseEnter = () => {
    setShowChatActions(true);
  };

  const handleMouseLeave = () => {
    setShowChatActions(false);
  };

  const messageOrigin =
    getProfileIdFromDID(message.fromDID) !== currentProfile?.id
      ? MessageOrigin.Sender
      : MessageOrigin.Receiver;

  return (
    <div
      className={clsx('flex items-center', {
        'flex-row-reverse': messageOrigin === MessageOrigin.Receiver
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={clsx('flex-col', {
          'self-end': messageOrigin === MessageOrigin.Sender
        })}
      >
        <MessageWrapper
          isAttachment={message.messageType !== 'Text'}
          messageOrigin={messageOrigin}
        >
          {message.messageType === 'Text' ? (
            <MessageCard
              chat={message}
              className={clsx(
                messageOrigin === MessageOrigin.Receiver ? 'text-white' : '',
                'max-w-[100%] break-words text-sm'
              )}
            />
          ) : (
            <Attachment message={message} />
          )}
        </MessageWrapper>
        <DisplayReactions MessageReactions={messageReactions} />
        <TimeStamp timestamp={message?.timestamp!} />
      </div>
      <div className="mr-3 mt-[-20px] flex">
        <ChatAction
          onClick={() => {
            setReplyToMessage(message);
          }}
          showAction={showChatActions}
        >
          <ArrowUturnLeftIcon
            className="text-brand-500 h-3 w-3"
            strokeWidth={2}
          />
        </ChatAction>
        <div ref={reactionRef}>
          <ChatAction
            onClick={() => {
              setShowReactions(true);
              setShowChatActions(false);
            }}
            showAction={showChatActions}
          >
            <FaceSmileIcon className={'text-brand-500 h-4 w-4'} />
          </ChatAction>
        </div>
        <div className="ml-2">
          {showReactions ? (
            <Reactions
              onClick={() => {
                setShowReactions(false);
                setShowChatActions(true);
              }}
              onValue={(value) => {
                sendMessage({
                  content: {
                    content: value,
                    type: MessageType.TEXT
                  },
                  reference: message.link!,
                  type: MessageType.REACTION
                });
                setShowReactions(false);
                setShowChatActions(true);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Message;