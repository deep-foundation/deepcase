import {
  Box, Button, IconButton, Modal, ModalContent, ModalOverlay, useColorMode,
  Editable,
  EditableInput,
  EditableTextarea,
  EditablePreview,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  Divider,
  Portal,
} from '@chakra-ui/react';
import { useDeep, useDeepSubscription } from '@deep-foundation/deeplinks/imports/client';
import { Link, useMinilinksFilter } from '@deep-foundation/deeplinks/imports/minilinks';
import { useLocalStore } from '@deep-foundation/store/local';
import { useDebounceCallback } from '@react-hook/debounce';
import json5 from 'json5';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscClearAll } from 'react-icons/vsc';
import { ClientHandler, ClientHandlerRenderer, evalClientHandler } from '../client-handler';
import { EditorComponentView } from '../editor/editor-component-view';
import { EditorGrid } from '../editor/editor-grid';
import { ListLanguages } from '../editor/editor-lang-list';
import { EditorResults } from '../editor/editor-results';
import { EditorSwitcher } from '../editor/editor-switcher';
import { CloseButton, EditorTabs } from '../editor/editor-tabs';
import { EditorTextArea } from '../editor/editor-textarea';
import { CatchErrors } from '../react-errors';
import { CytoEditorHandlers } from './handlers';
import { FinderPopover, useCytoEditor } from './hooks';
import { useSpaceId } from '../hooks';
import { AddIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, CloseIcon, SmallAddIcon, SmallCloseIcon } from '@chakra-ui/icons';
import EmojiPicker from 'emoji-picker-react';


const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), { ssr: false });

// global._callClientHandler = callClientHandler;
export interface EditorTab {
  id: number;
  saved?: boolean;
  active?: boolean;
  loading?: boolean;
  initialValue?: string;
}

export function useEditorValueSaver(tab) {
  const [values, setValues] = useLocalStore<any>('editor-values', {});
  const tempValueRef = useRef<any>();
  const valuesRef = useRef<any>();
  valuesRef.current = values;
  const setValuesDebounced = useDebounceCallback((value) => {
    setValues(value);
  }, 500);
  return {
    valuesRef,
    tempValueRef,
    value: values[tab],
    setValue: useCallback((id, value) => {
      tempValueRef.current = { ...valuesRef.current, [id]: value };
      setValuesDebounced({ ...valuesRef.current, [id]: value });
    }, []),
  };
}

export function useEditorTabs() {
  const [tabs, setTabs] = useLocalStore<EditorTab[]>('editor-tabs', []);
  const [tab, setTab] = useLocalStore<number>('editor-tab', 0);
  const tabsRef = useRef<any>();
  tabsRef.current = tabs;
  return {
    tabs,
    addTab: useCallback((tab) => {
      if (!tabsRef.current.find((t) => t.id === tab.id)) {
        setTabs([...tabsRef.current, tab]);
      }
    }, []),
    closeTab: useCallback((id) => {
      const newTabs = tabsRef.current.filter((tab) => tab.id !== id);
      setTabs(newTabs);
      if (newTabs.length) setTab(newTabs[newTabs.length - 1].id);
      else setTab(0);
    }, []),
    tabId: tab,
    tab: tabs.find((t) => +t.id === +tab),
    activeTab: useCallback((id) => {
      setTab(id);
    }, []),
    setTab: useCallback((tab) => {
      setTabs(tabsRef.current.map((t) => (t.id === tab.id ? tab : t)));
    }, []),
    setTabs,
  };
}

export function useFindClientHandlerByCode({
  codeLinkId,
}: {
  codeLinkId: number;
}) {
  const deep = useDeep();
  const [hid, setHid] = useState<any>();
  const prevCodeLinkId = useRef<number>();
  useEffect(() => { (async () => {
    if (!codeLinkId || codeLinkId === prevCodeLinkId.current) return;
    const { data: handlers } = await deep.select({
      execution_provider_id: { _eq: deep.idLocal('@deep-foundation/core', 'JSExecutionProvider'), },
      isolation_provider_id: { _eq: deep.idLocal('@deep-foundation/core', 'ClientJSIsolationProvider'), },
      _or: [
        // @ts-ignore
        { dist_id: { _eq: codeLinkId } },
        { src_id: { _eq: codeLinkId } },
      ],
    }, { table: 'handlers', returning: 'handler_id dist_id src_id' });
    // console.log('editor', 'handlers?.[0]', handlers?.[0])
    setHid(handlers?.[0]);
    prevCodeLinkId.current = codeLinkId;
  })(); }, [codeLinkId, hid]);
  return hid;
}

export const List = React.memo(function List({ link }: { link: any }) {
  const deep = useDeep();
  const {
    data: contained
  } = deep.useDeepSubscription({ in: { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: link.id } });
  return <>
    {<Box sx={{ paddingLeft: 4 }}>
      {contained.map(c => <Item key={c.id} link={c}/>)}
    </Box>}
  </>;
}, () => true);

export const Item = React.memo(function Item({
  link,
  openable = false,
  deletable = false,
  children = null,
  portalRef,
  closeTab,
  activeTab,
  addTab,
  isActive = false,
}: {
  link: Link<number>;
  openable?: boolean;
  deletable?: boolean;
  children?: any;
  portalRef?: any;
  closeTab?: (id: number) => void;
  activeTab?: (id: number) => void;
  addTab?: (tab: any) => void;
  isActive?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [spaceId] = useSpaceId();
  const deep = useDeep();
  const [currentSymbolLink] = deep.useMinilinksSubscription({ type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), to_id: link.id });
  const [typeSymbolLink] = deep.useMinilinksSubscription({ type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), to_id: link.type_id });
  const currentSymbol = currentSymbolLink?.value?.value;
  const typeSymbol = typeSymbolLink?.value?.value;
  return <>
    <Button
      sx={{ position: 'relative', display: 'block' }} width="100%" textAlign="left"
      isActive={isActive}
      size="sm"
      p={1}
      variant={"ghost"}
      onDoubleClick={() => {
        // alert(123)
      }}
      onClick={(event: any) => {
        if (event?.target == event?.currentTarget || event?.target?.type != 'button') {
          addTab({
            id: link.id, saved: true,
            initialValue: deep.stringify(link?.value?.value),
          });
          activeTab(link.id);
        }
      }}
    >
      <Box>
        {!!currentSymbol && <>
          <IconButton
            variant={'outline'}
            size="xs"
            icon={<>{currentSymbol}</>}
            aria-label={'icon change'}
            onClick={async () => {
              await deep.delete({ _or: [
                { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: spaceId, to: { type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), from_id: link.id } },
                { type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), from_id: link.id },
              ], });
            }}
          />
        </>}
        {!currentSymbol && <>
          <Popover isLazy>
            <PopoverTrigger>
              <IconButton
                variant={'solid'}
                size="xs"
                icon={<>{typeSymbol || ''}</>}
                aria-label={'icon change'}
              />
            </PopoverTrigger>
            <Portal containerRef={portalRef}>
              <PopoverContent>
                <EmojiPicker onEmojiClick={async ({ emoji }) => {
                  if (!link?.inByType?.[deep.idLocal('@deep-foundation/core', 'Symbol')]?.[0]?.id) {
                    await deep.insert({
                      type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), to_id: link.id, from_id: link.id,
                      string: { data: { value: emoji } },
                      in: { data: { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: spaceId } },
                    });
                  } else {
                    await deep.update({ link_id: link?.inByType?.[deep.idLocal('@deep-foundation/core', 'Symbol')]?.[0]?.id }, { value: emoji }, { table: 'strings' });
                  }
                  // if (!link?.type?.inByType?.[deep.idLocal('@deep-foundation/core', 'Symbol')]?.[0]?.id) return;
                }}/>
              </PopoverContent>
            </Portal>
          </Popover>
        </>}
        {/* <Box>{currentSymbol} | {typeSymbol}</Box> */}&nbsp;
        <Editable
          selectAllOnFocus defaultValue={deep.nameLocal(link.id) == `${link.id}` ? '' : deep.nameLocal(link.id)}
          placeholder={link.type_id === deep.idLocal('@deep-foundation/core', 'Package') ? link?.value?.value : link.id} display="inline"
          onSubmit={async (value) => {
            if (deep.minilinks.byId[link.id].inByType[deep.idLocal('@deep-foundation/core', 'Contain')]?.[0]?.value) {
              await deep.update({ link: { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), to_id: link.id } }, { value: value }, { table: 'strings' });
            } else {
              await deep.insert({ link_id: deep.minilinks.byId[link.id].inByType[deep.idLocal('@deep-foundation/core', 'Contain')]?.[0]?.id, value: value }, { table: 'strings' });
            }
          }}
          onCancel={(value) => {}}
        >
          <EditablePreview w="calc(100% - 32px)" />
          <EditableInput w="calc(100% - 32px)"/>
        </Editable>
      </Box>
      {/* <Box fontSize='xs'>{link.id} <Box display="inline" color="grey">({link.type_id} {deep.nameLocal(link.type_id)})</Box></Box> */}
      {/* <Box fontSize='xs'>{link.type_id} {deep.nameLocal(link.type_id)}</Box> */}
      <Box 
        position='absolute'
        right={1}
        top={1}
      >
        {children}
        {deletable && <IconButton
          isRound={true}
          aria-label='open level'
          fontSize='20px'
          size='xs'
          onClick={async () => {
            if (confirm(`Delete ${link.id} ${deep.nameLocal(link.id)} (${deep.nameLocal(link.type_id)})`)) {
              await deep.delete({ _or: [
                { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: spaceId, to_id: link.id },
                { id: link.id },
              ], });
              closeTab(link.id);
            }
          }}
          icon={<SmallCloseIcon />}
        />}
        &nbsp;
        {openable && <IconButton
          isRound={true}
          aria-label='open level'
          fontSize='20px'
          size='xs'
          onClick={() => setOpened(o => !o)}
          icon={opened ? <ChevronDownIcon /> : <ChevronLeftIcon />}
        />}
      </Box>
    </Button>
    {opened && <List link={link}/>}
  </>;
});

export const CytoEditorNav = React.memo(function CytoEditorNav({
  portalRef
}: {
  portalRef?: any;
}) {
  const deep = useDeep();
  const [spaceId] = useSpaceId();
  const [space] = deep.useMinilinksSubscription({ id: spaceId || 0 });
  const links = deep.useMinilinksSubscription({ in: { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: spaceId || 0 } });
  const {
    tab,
    tabs,
    setTab,
    activeTab,
    tabId,
    setTabs,
    addTab,
    closeTab,
  } = useEditorTabs();

  const PortalProps = useMemo(() => ({
    containerRef: portalRef,
  }), []);

  return <>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 300, height: '100%', overflowY: 'scroll' }}>
      {!!space && <Item link={space} portalRef={portalRef} closeTab={closeTab} activeTab={activeTab} addTab={addTab} isActive={+tab?.id === +spaceId}>
        <FinderPopover link={space}
          PortalProps={PortalProps}
          search={''}
          onSubmit={async (link) => {
            await deep.insert({
              type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
              string: { data: { value: '' } },
              from_id: spaceId,
              to: { data: { type_id: link.id } },
            });
          }}
        >
          <IconButton
            isRound={true}
            aria-label='open level'
            fontSize='20px'
            size='xs'
            icon={<><SmallAddIcon/></>}
          />
        </FinderPopover>
      </Item>}
      <Divider/>
      {links.map(l => <Item key={l.id} openable deletable link={l} portalRef={portalRef} closeTab={closeTab} activeTab={activeTab} addTab={addTab}  isActive={+tab?.id === +l.id}/>)}
    </div>
  </>;
}, () => true);

export const CytoEditor = React.memo(function CytoEditor() {
  const [cytoEditor, setCytoEditor] = useCytoEditor();
  const onClose = useCallback(() => {
    setCytoEditor(false);
  }, []);
  const deep = useDeep();

  const {
    tab,
    tabs,
    closeTab,
    setTab,
    activeTab,
    tabId,
    setTabs,
  } = useEditorTabs();
  const portalRef = useRef();

  const [currentLinkId, setCurrentLinkId] = useState(tabId || 0);
  if (!currentLinkId && tabId) {
    setCurrentLinkId(tabId);
  }

  const { data: [currentLink = deep?.minilinks?.byId[currentLinkId]] = [] } = useDeepSubscription({
    id: currentLinkId || 0,
  });

  const onCloseAll = useCallback(() => {
    setTabs([]);
  }, []);

  const {
    tempValueRef,
    valuesRef,
    value,
    setValue,
  } = useEditorValueSaver(tabId);

  // console.log('editor', 'GeneratedFrom idLocal', deep.idLocal('@deep-foundation/core', 'GeneratedFrom'));
  // console.log('editor', 'tabId', tabId);

  const hid = useFindClientHandlerByCode({
    codeLinkId: tabId,
  });
  const handlerId = hid?.handler_id;

  const generatedLink = useMinilinksFilter(
    deep.minilinks,
    (link) => {
      const filterResult = link?.outByType?.[deep.idLocal('@deep-foundation/core', 'GeneratedFrom')]?.[0]?.to_id === tabId;
      return filterResult;
    },
    (link, ml) => {
      return ml?.byId[tabId]?.inByType[deep.idLocal('@deep-foundation/core', 'GeneratedFrom')]?.[0]?.from;
    },
  )

  const [currentLanguage, setCurrentLanguage] = useLocalStore('df-dc-editor-currentLanguage', 'plaintext');
  useEffect(() => {
    refEditor.current?.monaco.editor.setModelLanguage(refEditor.current?.monaco.editor.getModels()[0], currentLanguage);
  }, [currentLanguage]);

  const currentValue = valuesRef?.current?.[tabId] || typeof tab?.initialValue !== 'undefined' ? tab?.initialValue : '';

  const refEditor = useRef<any>();

  const [rightArea, setRightArea] = useState('preview');
  const [fillSize, setFillSize] = useState(false);
  const [viewSize, setViewSize] = useState<any>({ width: '50%', height: '100%' });
  const [editorMounted, setEditorMounted] = useState(false);

  const errorRenderer = useMemo(() => {
    return (error, reset) => {
      return <div>{json5.stringify(error)}</div>
    };
  }, []);

  const focusEditor = useCallback(() => {
    // @ts-ignore
    refEditor?.current?.editor?.focus();
  }, []);

  const languages = refEditor.current?.monaco.languages.getLanguages();
  const validationTS = refEditor.current?.monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });

  const { colorMode } = useColorMode();

  const [Component, setComponent] = useState(undefined);
  useEffect(() => {
    if (handlerId) {
      return;
    }
    const value = generatedLink?.value?.value || currentLink?.value?.value;
    console.log('editor', 'evalClientHandler', 'useEffect', value);
    if (!value) {
      return;
    }
    evalClientHandler({ value, deep }).then(({ data, error }) => {
      console.log('editor', 'evalClientHandler', 'error', error);
      console.log('editor', 'evalClientHandler', 'data', data);
      if (!error && data) { 
        setComponent(() => data);
      } else if (Component !== undefined) {
        setComponent(undefined);
      }
    });
  }, [handlerId, currentLink?.value?.value, generatedLink?.value?.value]);

  return <>
    <Modal isOpen={cytoEditor} onClose={onClose} size='full' onEsc={onClose}>
      <ModalOverlay />
      <ModalContent sx={{ height: '100vh', overflow: 'initial', position: 'relative' }}>
        <div ref={portalRef}/>
        <EditorGrid
          sash
          editorTextAreaElement={<>{[
            <CytoEditorNav portalRef={portalRef}/>,
            <Box
              key={tabId}
              sx={{
                pos: 'relative',
                left: 300,
                height: '100%',
                width: 'calc(100% - 300px)',
              }}
            >
              <EditorTextArea
                refEditor={refEditor}
                value={currentValue}
                defaultLanguage={currentLanguage}
                onChange={(value) => {
                  setValue(tabId, value);
                  setTab({ ...tab, saved: tab.initialValue === value });
                }}
                onClose={() => {
                  if (tabs.length === 1 && tabs[0]?.id === tab.id) onClose();
                  closeTab(tabId);
                  setValue(tabId, undefined);
                  focusEditor();
                }}
                onSave={async (savedValue) => {
                  const value = tempValueRef?.current?.[tabId] || savedValue;
                  const Value = await deep.id({ in: { type_id: { _id: ['@deep-foundation/core', 'Value'] }, from: { typed: { id: { _eq: tab.id } } } } });
                  const table = Value === deep.idLocal('@deep-foundation/core', 'String') ? 'strings' : Value === deep.idLocal('@deep-foundation/core', 'Number') ? 'numbers' : Value === deep.idLocal('@deep-foundation/core', 'Object') ? 'objects' : undefined;
                  const type = Value === deep.idLocal('@deep-foundation/core', 'String') ? 'string' : Value === deep.idLocal('@deep-foundation/core', 'Number') ? 'number' : Value === deep.idLocal('@deep-foundation/core', 'Object') ? 'object' : 'undefined';

                  let _value;
                  try {
                    _value = table === 'strings' ? value : table === 'numbers' ? parseFloat(value) : table === 'objects' ? json5.parse(value) : undefined;
                  } catch (error) {
                    console.log('error123', error);
                  }

                  if (!deep.minilinks.byId[tab.id]?.value) {
                    await deep.insert({ link_id: tab.id, value: _value }, {
                      table: table,
                    });
                    setTab({ ...tab, initialValue: value, loading: false, saved: true });
                  } else if (type !== 'undefined') {
                    await deep.update({ link_id: { _eq: tab.id } }, {
                      value: _value,
                    }, {
                      table: `${type}s`,
                    });
                    setTab({ ...tab, initialValue: value, loading: false, saved: true });
                  } else {
                    setTab({ ...tab, initialValue: value, loading: false, saved: false });
                  }
                }}
                onMount={() => setEditorMounted(true)}
              />
              {/* <div style={{ position: 'absolute', left: 300, top: 0, width: 'calc(100% - 300px)', height: '100%', background: 'green', opacity: 0.5 }}></div> */}
              <Box
                w='100%'
                pos='absolute'
                bottom='0'
                borderTopColor='borderColor'
                borderTopWidth='thin'
                p='0.5rem'
                height='auto'
                bg='lightDark'
              >
                <Box pos='relative' height='100%'>
                  <ListLanguages
                    languages={languages}
                    currentLanguage={currentLanguage}
                    setLanguage={(i) => {
                      if (i == 'typescript') validationTS
                      setCurrentLanguage(i);
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ]}</>}
          editorTabsElement={<EditorTabs
            tabs={tabs.map((tab) => ({
              ...tab,
              active: tabId === tab.id,
            }))}
            setTabs={(tabs) => setTabs(tabs)}
            onClose={(tab) => {
              if (tabs.length === 1 && tabs[0]?.id === tab.id) onClose();
              closeTab(tab.id);
              setValue(tabId, undefined);
              focusEditor();
            }}
            onClick={(tab) => {
              activeTab(tab.id);
              focusEditor();
            }}
            onSaveTab={async (savedValue) => {
              const value = tempValueRef?.current?.[tabId] || savedValue;
              const Value = await deep.id({ in: { type_id: { _id: ['@deep-foundation/core', 'Value'] }, from: { typed: { id: { _eq: tab.id } } } } });
              const table = Value === deep.idLocal('@deep-foundation/core', 'String') ? 'strings' : Value === deep.idLocal('@deep-foundation/core', 'Number') ? 'numbers' : Value === deep.idLocal('@deep-foundation/core', 'Object') ? 'objects' : undefined;
              const type = Value === deep.idLocal('@deep-foundation/core', 'String') ? 'string' : Value === deep.idLocal('@deep-foundation/core', 'Number') ? 'number' : Value === deep.idLocal('@deep-foundation/core', 'Object') ? 'object' : 'undefined';

              let _value;
              try {
                _value = table === 'strings' ? value : table === 'numbers' ? parseFloat(value) : table === 'objects' ? json5.parse(value) : undefined;
              } catch (error) { }

              if (!deep.minilinks.byId[tab.id]?.value) {
                await deep.insert({ link_id: tab.id, value: _value }, {
                  table: table,
                });
                setTab({ ...tab, initialValue: value, loading: false, saved: true });
              } else if (type !== 'undefined') {
                await deep.update({ link_id: { _eq: tab.id } }, {
                  value: _value,
                }, {
                  table: `${type}s`,
                });
                setTab({ ...tab, initialValue: value, loading: false, saved: true });
              } else {
                setTab({ ...tab, initialValue: value, loading: false, saved: false });
              }
              console.log('onclick');
            }}
          />}
          closeAllButtonElement={<IconButton icon={<VscClearAll />} onClick={onCloseAll} aria-label='Close all tabs' />}
          closeButtonElement={<CloseButton onClick={onClose} />}
          editorRight={
            // rightArea === 'handlers' && (<EditorHandlers generated={generated} setGenerated={setGenerated}>
            // <EditorHandler
            //   reasons={reasons}
            //   avatarElement={<CytoReactLinkAvatar emoji='💥' />}
            //   title='first'
            //   sync={false}
            //   onChangeSync={() => {}}
            // ></EditorHandler>
            // </EditorHandlers>) ||
            rightArea === 'handlers' && (
              <CytoEditorHandlers linkId={tab?.id} handleredableIds={generatedLink ? [generatedLink?.id, tab.id] : [tab?.id]} />
            ) ||
            rightArea === 'preview' && <Box
              pos='relative'
              sx={{
                backgroundColor: 'editorPreviewBackground',
                backgroundImage: `linear-gradient(-90deg, ${'editorPreviewBackgroundGrid'} 1px, transparent 1px), linear-gradient(0deg, ${'editorPreviewBackgroundGrid'} 1px, transparent 1px), linear-gradient(transparent 0px, ${'editorPreviewBackground'} 1px, ${'editorPreviewBackground'} 20px, transparent 20px), linear-gradient(-90deg, ${'editorPreviewBackgroundGrid'} 1px, transparent 1px), linear-gradient(-90deg, transparent 0px, ${'editorPreviewBackground'} 1px, ${'editorPreviewBackground'} 20px, transparent 20px), linear-gradient(0deg, ${'editorPreviewBackgroundGrid'} 1px, transparent 1px)`,
                backgroundSize: '20px 20px, 20px 20px, 20px 20px, 20px 20px, 20px 20px, 20px 20px',
              }}
            >
              {[<EditorComponentView
                key={`${currentLink?.id || 0}-${tabId}-${handlerId}`}
                size={viewSize}
                onChangeSize={(viewSize) => setViewSize(viewSize)}
                fillSize={fillSize}
                setFillSize={setFillSize}
              >
                {handlerId && [<ClientHandler key={`${currentLink?.id || 0}-${tabId}-${handlerId}`} handlerId={handlerId} fillSize={fillSize} linkId={currentLink?.id} ml={deep.minilinks} />]}
                {!handlerId && typeof(Component) === 'function' && [<CatchErrors 
                  key={Component.toString()}
                  errorRenderer={(error) => {
                    console.log('EditorComponentView', 'errorRenderer', error);
                    return <div>{JSON.stringify(error)}</div>;
                  }}>
                    <ClientHandlerRenderer Component={Component} fillSize={fillSize} link={deep?.minilinks?.byId[currentLink?.id]}/>
                  </CatchErrors>]}
              </EditorComponentView>]}
            </Box> ||
            rightArea === 'results' && <EditorResults id={tab.id} />
          }
          editorRightSwitch={<EditorSwitcher
            portalRef={portalRef}
            fillSize={fillSize}
            setFillSize={(newFillSize) => {
              setFillSize(newFillSize);
              if (!fillSize) setViewSize({ width: 250, height: 250 });
            }}
            currentLinkId={currentLinkId}
            setCurrentLinkId={(newCurrentLinkId) => {
              setCurrentLinkId(newCurrentLinkId)
            }}
            area={rightArea}
            setArea={(rightArea) => {
              setRightArea(rightArea);
            }}
          />}
        />
      </ModalContent>
    </Modal>
  </>;
}, () => true);
