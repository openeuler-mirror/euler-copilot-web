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
import { Metadata } from 'src/apis/paths/type';

// 工具类型
export type LinkType = 'redirect' | 'action';

export interface LinkItem {
  key: string;
  label: string;
  type: LinkType;
  url?: string;
  icon?: any;
}

export interface EgItem {
  icon?: any;
  iconDark?: any;
  key: string;
  insertMessage: string;
  style?: string;
  title: string;
  des?:string;
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
  cid: number;
  belong: UserDialoguePanelType;
  message: string;
  createdAt?: string | Date;
  params?: any;
}

export interface FlowType {
  id:number
  title:string,
  status:string,
  data:any,
  display:boolean,
  progress:string,
  flowId?:string,
}

export interface FlowDataType {
  id: string,
  stauts:string,
  // title: '',
  data: any|undefined,
}

export interface AppShowType {
  appId: string,
  name:string,
}


export interface RobotConversationItem {
  files?:any;
  flow?:any;
  cid: number;
  conversationId: string;
  recordId: string;
  extraData?:any;
  belong: RobotDialoguePanelType;
  message: string[];
  messageList:MessageArray;
  // 当前选中第n次回答的索引值
  currentInd: number;
  isFinish?: boolean;
  isSupport?: boolean;
  isAgainst?: boolean;
  createdAt?: string | Date;
  groupId:string|undefined;
  search_suggestions?:string[];
  echartsObj?:any,
  metadata?:undefined | Metadata;
  flowdata?:FlowType;
  paramsList?:any;
}

export interface MessageRecord {
  message:string;
  record_id:string;
  is_like:number|undefined;
}

export class MessageArray {
  private items:MessageRecord[] = [];
  addItem(message: string,record_id:string,is_like:number):void {
    const newItem: MessageRecord = {
      message,
      record_id,
      is_like,
    };
    this.items.push(newItem);
  }

  getItem(index: number):MessageRecord|undefined {
    return this.items[index];
  }

  getLength():number {
    return this.items.length;
  }

  getAllItems():MessageRecord[]{
    return this.items;
  }

  getMessageList(): string[] {   
    return this.items.map(item => item.message);  
  }  

  getRecordIdList(): string[] {    
    return this.items.map(item => item.record_id);  
  }  
  
  getIslikeList(): number[] {   
    return this.items.map(item => item.is_like);  
  }  

  getisLikeByIndex(index:number): number {
    return this.items.map(item => item.is_like)[index];
  }

  changeisLikeByCidAndIndex(cid:number,index:number,islike:number|boolean):void {
    const a = this.getisLikeByIndex(index)[cid];
    this.getisLikeByIndex(index)[cid] = islike;
  }

}
