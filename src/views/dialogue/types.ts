// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import type {
  UserDialoguePanelType,
  RobotDialoguePanelType,
} from 'src/components/dialoguePanel/type';

export interface EgItem {
  icon?: any;
  iconDark?: any;
  key: string;
  insertMessage: string;
  style?: string;
  title: string;
}

export interface ChainItem {
  key: string;
  label: string;
  type: string;
  url?: string;
  icon?: any;
}

export type ConversationItem = UserConversationItem | RobotConversationItem;

export interface UserConversationItem {
  [key: string]: any;
  cid: number;
  belong: UserDialoguePanelType;
  message: string;
  createdAt?: string | Date;
}

export interface RobotConversationItem {
  [key: string]: any;
  cid: number;
  sessionId: string;
  recordId: string;
  belong: RobotDialoguePanelType;
  message: string[];
  copyList: string[];
  messageList: MessageArray;
  // 当前选中第n次回答的索引值
  currentInd: number;
  isFinish?: boolean;
  isSupport?: boolean;
  isAgainst?: boolean;
  createdAt?: string | Date;
  groupId?: string;
  searchSuggestions?: string[];
}

export interface MessageRecord {
  message: string;
  recordId: string;
  isLike: number | undefined;
}

export class MessageArray {
  private items: MessageRecord[] = [];
  addItem(message: string, recordId: string, isLike: number): void {
    const newItem: MessageRecord = {
      message,
      recordId,
      isLike: isLike,
    };
    this.items.push(newItem);
  }

  getItem(index: number): MessageRecord | undefined {
    return this.items[index];
  }

  getLength(): number {
    return this.items.length;
  }

  getAllItems(): MessageRecord[] {
    return this.items;
  }

  getMessageList(): string[] {
    return this.items.map(item => item.message);
  }

  getRecordIdList(): string[] {
    return this.items.map(item => item.recordId);
  }

  getIslikeList(): (number | undefined)[] | undefined {
    return this.items.map(item => item.isLike);
  }
}
