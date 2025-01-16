export enum UploadTypeName {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  TXT = 'txt',
  MD = 'md',
  XLSX = 'xlsx',
}
export enum UploadType {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC = 'application/msword',
  TXT = 'text/plain',
  MDF= '',
  MDB = 'markdown/plain',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export enum UploadStatus {
  UNUSED = 'unused',
  USED = 'used',
  UPLOADING = 'uploading',
  UPLOADFAIL = 'uploadfail',
  RESOLVEFAIL = 'failed',
  RESOLVING = 'processing',
}

export type UploadFileType =
  | UploadType.PDF
  | UploadType.DOCX
  | UploadType.DOC
  | UploadType.TXT
  | UploadType.MDF
  | UploadType.MDB
  | UploadType.XLSX;

export type UploadFileStatus =
  | UploadStatus.USED
  | UploadStatus.UNUSED
  | UploadStatus.UPLOADING
  | UploadStatus.UPLOADFAIL
  | UploadStatus.RESOLVEFAIL
  | UploadStatus.RESOLVING;

export type UploadFileCard = {
  type: UploadFileType;
  status: UploadFileStatus;
  name: string;
  size: string;
  id?: string;
  batch?: number;
  created_at?: number;
};
