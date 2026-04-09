import { CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Badge, Button, message, Modal, Radio, Space, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd';
import classNames from 'classnames';
import { useMemo, useState } from 'react';
import { impexImport, postOperatorRegiste, postToolBox } from '@/apis';
import styles from './ImportToolboxAndOperatorModal.module.less';

const { Text, Link } = Typography;

enum SourceTypeEnum {
  OpenAPI = 'OpenAPI',
  AIDataPlatform = 'AIDataPlatform',
}

enum ModeEnum {
  Upsert = 'upsert',
  Create = 'create',
}

interface Props {
  activeTab: 'tool_box' | 'operator';
  onCancel: () => void;
  onOk: () => void;
}

const ImportToolboxAndOperatorModal = ({ activeTab, onCancel, onOk }: Props) => {
  const [sourceType, setSourceType] = useState<SourceTypeEnum | null>(null);
  const [mode, setMode] = useState<ModeEnum>(ModeEnum.Upsert);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const typeName = activeTab === 'tool_box' ? '工具箱' : '算子';

  const uploadProps: UploadProps = useMemo(
    () => ({
      maxCount: 1,
      beforeUpload: f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        if (sourceType === SourceTypeEnum.OpenAPI && !['yaml', 'yml', 'json'].includes(ext)) {
          message.info('OpenAPI 仅支持 yaml/yml/json');
          return Upload.LIST_IGNORE;
        }
        if (sourceType === SourceTypeEnum.AIDataPlatform && ext !== 'adp') {
          message.info('AI Data Platform 仅支持 .adp');
          return Upload.LIST_IGNORE;
        }
        if (f.size / 1024 / 1024 > 5) {
          message.info('文件大小不能超过 5MB');
          return Upload.LIST_IGNORE;
        }
        setFile(f);
        return false;
      },
      onRemove: () => {
        setFile(null);
        return true;
      },
      fileList: file ? [{ uid: file.name, name: file.name, status: 'done' }] : [],
    }),
    [file, sourceType]
  );

  const handleImport = async () => {
    if (!sourceType || !file) {
      message.info('请先选择来源并上传文件');
      return;
    }
    const formData = new FormData();
    formData.append('data', file);
    setLoading(true);
    try {
      if (sourceType === SourceTypeEnum.AIDataPlatform) {
        formData.append('mode', mode);
        await impexImport(formData, activeTab === 'tool_box' ? 'toolbox' : 'operator');
      } else {
        if (activeTab === 'tool_box') {
          formData.append('metadata_type', 'openapi');
          await postToolBox(formData);
        } else {
          formData.append('operator_metadata_type', 'openapi');
          const result = await postOperatorRegiste(formData);
          const failedCount = (result || []).filter(item => item?.status === 'failed').length;
          message.success(`上传成功 ${Math.max((result || []).length - failedCount, 0)} 个`);
          if (failedCount > 0) {
            message.warning(`${failedCount} 个导入失败，请检查文件内容`);
          }
          onOk();
          return;
        }
      }
      message.success(`导入${typeName}成功`);
      onOk();
    } catch (error: any) {
      message.error(error?.description || `导入${typeName}失败`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`导入${typeName}`}
      open
      width={640}
      centered
      maskClosable={false}
      onCancel={onCancel}
      footer={[
        <Button key="ok" type="primary" loading={loading} onClick={handleImport}>
          确定
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
      ]}
    >
      <div className={styles.content}>
        <Text type="secondary">请选择数据来源格式：</Text>
        <div className="dip-mt-12 dip-mb-16 dip-flex dip-gap-12">
          {[
            { type: SourceTypeEnum.OpenAPI, label: 'OpenAPI' },
            { type: SourceTypeEnum.AIDataPlatform, label: 'AI Data Platform' },
          ].map(item => {
            const selected = sourceType === item.type;
            return (
              <Badge key={item.type} count={selected ? '✓' : 0} offset={[-8, 8]}>
                <Button
                  className={classNames(styles.sourceBtn, { [styles.sourceBtnSelected]: selected })}
                  onClick={() => {
                    setSourceType(item.type);
                    setFile(null);
                  }}
                >
                  {item.label}
                </Button>
              </Badge>
            );
          })}
        </div>

        {sourceType ? (
          <>
            <div className={styles.tip}>
              <InfoCircleOutlined className="dip-mr-8" />
              {sourceType === SourceTypeEnum.OpenAPI ? (
                <>
                  支持导入 OpenAPI 3.0 的 JSON/YAML 文件。
                  <span className="dip-ml-8">
                    <Link href="https://openapi.apifox.cn/" target="_blank">
                      OpenAPI 规范
                    </Link>
                  </span>
                </>
              ) : (
                <span>支持导入 AI Data Platform 导出的 .adp 文件。</span>
              )}
            </div>

            <Upload.Dragger {...uploadProps}>
              <div style={{ height: 180 }} className="dip-column-center">
                <CloudUploadOutlined className="dip-font-24 dip-mb-8" />
                <p className={styles.uploadText}>点击或拖拽文件到此区域导入（不超过 5MB）</p>
              </div>
            </Upload.Dragger>

            {sourceType === SourceTypeEnum.AIDataPlatform ? (
              <div className="dip-mt-16">
                <p className="dip-mb-8">若检测到同名{typeName}已存在：</p>
                <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
                  <Space direction="vertical">
                    <Radio value={ModeEnum.Upsert}>更新已有{typeName}</Radio>
                    <Radio value={ModeEnum.Create}>终止导入</Radio>
                  </Space>
                </Radio.Group>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
};

export default ImportToolboxAndOperatorModal;
