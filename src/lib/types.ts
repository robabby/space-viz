export interface FileNode {
  name: string;
  size: number;
  path: string;
  hidden?: boolean;
  children?: FileNode[];
}

export interface ScanResult {
  root: FileNode;
  totalSize: number;
  fileCount: number;
  scanDuration: number;
}
