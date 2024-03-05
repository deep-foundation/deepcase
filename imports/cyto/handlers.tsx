import { useSubscription } from '@apollo/client';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Accordion, AccordionItem, AccordionButton, AccordionIcon, AccordionPanel, Box, Flex, SimpleGrid, Text, Button, Spacer, useColorMode, InputGroup, Input, InputRightElement, Tag, TagCloseButton, TagLabel, HStack, VStack, Select, Menu, MenuButton, MenuItem, MenuList, IconButton, InputLeftElement } from '@chakra-ui/react';
import { useDeep, useDeepQuery, useDeepSubscription } from '@deep-foundation/deeplinks/imports/client';
import { generateQuery, generateQueryData } from '@deep-foundation/deeplinks/imports/gql';
import { Link, useMinilinksApply, useMinilinksQuery, useMinilinksSubscription } from '@deep-foundation/deeplinks/imports/minilinks';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CytoReactLinkAvatar } from '../cyto-react-avatar';
import { EditorHandler } from '../editor/editor-handler';
import { useChackraColor } from '../get-color';
import { useContainer, useSpaceId } from '../hooks';
import { VscCheck, VscDiffAdded } from 'react-icons/vsc';
import { FinderPopover } from './hooks';

export const CytoEditorHandlersSupportHandle = React.memo(function CytoEditorHandlersSupport({
  support,
  handler,
  handle,
  portalRef,
}: {
  support: Link<number>;
  handler: Link<number>;
  handle: Link<number>;
  portalRef?: any;
}) {
  const deep = useDeep();
  const gray900 = useChackraColor('gray.900');
  const white = useChackraColor('white');
  const { colorMode } = useColorMode();
  const [value, setValue] = useState('');

  const [adding, setAdding] = useState(false);

  const mouseoutRef = useRef<any>();

  const onLeave = (e) => {
    clearTimeout(mouseoutRef.current);
    if (document.activeElement !== e.target) mouseoutRef.current = setTimeout(() => {
      setAdding(false);
      setInserting(false);
    }, 1000);
  };

  const HandleName = handle?.inByType?.[deep.idLocal('@deep-foundation/core', 'Contain')]?.[0]?.value?.value;

  const [inserting, setInserting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [container] = useContainer();

  const onInsert = useCallback(async (v) => {
    const _value = v || value;
    setInserting(true);
    await deep.insert({
      type_id: handle.id,
      from_id: +_value,
      to_id: handler.id,
      in: { data: {
        type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
        from_id: container,
      } }
    });
    setInserting(false);
    setValue('');
  }, [value, container]);

  const onDelete = useCallback(async (handleId) => {
    const link = deep.minilinks.byId[handleId];
    if (confirm(`Delete ${handleId} (${link.type_id}) = ${link.from_id} > ${link.to_id}?`)) {
      await deep.delete(handleId);
    }
  }, []);

  const { data: handles } = useDeepSubscription({
    type_id: handle?.id,
    to_id: handler?.id,
  });

  const { data: ports } = useDeepSubscription({
    type_id: deep.idLocal('@deep-foundation/core', 'Port'),
  });

  const isLink = ['HandleInsert', 'HandleUpdate', 'HandleDelete'].includes(HandleName);
  const isRoute = HandleName === 'HandleRoute';
  const isPort = HandleName === 'HandlePort';
  const isSchedule = HandleName === 'HandleSchedule';
  const isClient = HandleName === 'HandleClient';

  const Handle = useCallback((
    isLink
    ? (h) => {
      return <Tag size='sm' borderRadius='full' variant='solid'>
        <TagLabel>{h.from_id} {deep.nameLocal(h.from_id)}</TagLabel>
        <TagCloseButton onClick={() => onDelete(h.id)}/>
      </Tag>;
    }
    : (h) => {
      return <Tag size='sm' borderRadius='full' variant='solid'>
        <TagLabel>{h.from_id} {deep.nameLocal(h.from_id)}</TagLabel>
        <TagCloseButton onClick={() => onDelete(h.id)}/>
      </Tag>;
    }
  ), [deleting]);

  const PortalProps = useMemo(() => ({
    containerRef: portalRef,
  }), []);
  const [space] = useSpaceId();
  const [spaceL] = deep.useMinilinksSubscription({ id: space });

  const Form = useCallback((
    isLink || isClient
    ? ({ value, onInsert }: { value: string, onInsert: (id?: number) => void }) => {
      return <InputGroup
        position='absolute' w='100%' 
        size='md' h='100%' left={0} top={0} borderWidth='1px' borderRadius='lg' bgColor='handlersInput'
        onMouseMove={() => {
          clearTimeout(mouseoutRef.current);
        }}
      >
        <Input
          autoFocus
          h='100%'
          type='number'
          placeholder='id'
          onMouseLeave={onLeave}
          onMouseOver={() => {
            clearTimeout(mouseoutRef.current);
            !adding && setAdding(true);
          }}
          onBlur={onLeave}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        {value !== '' ? <InputRightElement h='100%'>
          <IconButton
            size='sm' variant='ghost' onClick={() => onInsert()}
            isLoading={inserting}
            isRound
            aria-label='save and add id'
            icon={<VscCheck />}
          />
        </InputRightElement> : <InputRightElement>
          <FinderPopover
            PortalProps={PortalProps}
            onOpen={() => {
              clearTimeout(mouseoutRef.current);
            }}
            link={spaceL}
            onSubmit={async (link) => {
              setValue(link.id);
              onInsert(link.id);
            }}
          >
            <IconButton
              isRound
              aria-label='finder'
              size='sm'
              variant='ghost'
              icon={<>🪬</>}
            />
          </FinderPopover>
        </InputRightElement>}
      </InputGroup>;
    }
    : isPort
    ? ({ value, onInsert }: { value: string, onInsert: (id?: number) => void }) => {
      return <InputGroup
        position='absolute' w='100%' h='100%' left={0} top={0} borderWidth='1px' borderRadius='lg' bgColor='handlersInput'
        onMouseMove={() => {
          clearTimeout(mouseoutRef.current);
        }}
      >
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            h={'100%'}
            w={`calc(100% - 60px)`}
          >
            Port
          </MenuButton>
          <MenuList>
            <MenuItem>+</MenuItem>
            {ports.map(port => (<MenuItem key={port.id}>{port.id}</MenuItem>))}
          </MenuList>
        </Menu>
        {value !== '' ? <InputRightElement h='100%'>
          <IconButton
            size='sm' variant='ghost' onClick={() => onInsert()}
            isLoading={inserting}
            isRound
            aria-label='save and add id'
            icon={<VscCheck />}
          />
        </InputRightElement> : null}
      </InputGroup>;
    }
    : ({ value, onInsert }: { value: string, onInsert: (id?: number) => void }) => {
      return <InputGroup
        position='absolute' w='100%' h='100%' left={0} top={0} borderWidth='1px' borderRadius='lg' bgColor='handlersInput'
        onMouseMove={() => {
          clearTimeout(mouseoutRef.current);
        }}
      >
        <Input
          autoFocus
          h='100%'
          type={'number'}
          placeholder='id'
          onMouseLeave={onLeave}
          onMouseOver={() => {
            clearTimeout(mouseoutRef.current);
            !adding && setAdding(true);
          }}
          onBlur={onLeave}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        {value !== '' ? <InputRightElement h='100%'>
          <IconButton
            size='sm' variant='ghost' onClick={() => onInsert()}
            isLoading={inserting}
            isRound
            aria-label='save and add id'
            icon={<VscCheck />}
          />
        </InputRightElement> : <InputRightElement>
          <FinderPopover
            PortalProps={PortalProps}
            onOpen={() => {
              clearTimeout(mouseoutRef.current);
            }}
            link={spaceL}
            onSubmit={async (link) => {
              setValue(link.id);
              onInsert(link.id);
            }}
          >
            <IconButton
              isRound
              aria-label='finder'
              size='sm'
              variant='ghost'
              icon={<>🪬</>}
            />
          </FinderPopover>
        </InputRightElement>}
      </InputGroup>;
    }
  ), []);

  return <Box width='100%'>
    <Box 
      borderWidth='1px' 
      borderRadius='lg' 
      display='flex' 
      flexDirection='column' 
    >
      <Box p='0.5rem'>
        <Flex position='relative' p='0.3rem'  borderWidth='thin' borderRadius='lg'>
          <Text p={1}>
            {HandleName}
          </Text>
          <Spacer />
          <IconButton icon={<VscDiffAdded />} aria-label='insert handle' size='sm' variant='ghost' isRound onClick={() => setAdding(true)} disabled={!(isLink || isPort || isClient)} />
          {adding && <Form value={value} onInsert={onInsert}/>}
        </Flex>
      </Box>
      {!!handles?.length && <>
        <Box 
          pl='0.5rem' 
          pb='0.2rem' 
          float='left' sx={{
            '& > *:not(:last-of-type)': {
              marginRight: '0.5rem'
            }
          }}
        >
          {handles.map(Handle)}
        </Box>
      </>}
    </Box>
  </Box>;
});

export const CytoEditorHandlersSupport = React.memo(function CytoEditorHandlersSupport({
  support,
  linkId,
  handleredableIds,
  portalRef,
}: {
  support: Link<number>;
  linkId: number;
  handleredableIds: number[];
  portalRef?: any;
}) {
  const deep = useDeep();
  const { data: handlers } = useDeepSubscription({
    type_id: deep.idLocal('@deep-foundation/core', 'Handler'),
    from_id: support.id,
    to_id: { _in: handleredableIds },
  });

  const [container] = useContainer();

  const onInsertHandler = useCallback(async () => {
    await deep.insert({
      to_id: linkId,
      from_id: support.id,
      type_id: deep.idLocal('@deep-foundation/core', 'Handler'),
      in: { data: {
        type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
        from_id: container,
      } }
    });
  }, [container]);

  const onDeleteHandler = useCallback(async (handlerId) => {
    await deep.delete(handlerId);
  }, []);

  return <AccordionItem>
    <AccordionButton>
      <Flex w='100%' alignItems='center'>
        <Box flex='1' textAlign='left'>
          Support: {support.id} {support.inByType[deep.idLocal('@deep-foundation/core', 'Contain')]?.[0]?.value?.value}
        </Box>
        <Spacer/>
        <IconButton aria-label='insert handler' isRound size='sm' variant='ghost' 
          onClick={(e) => {
            e.stopPropagation();
            onInsertHandler();
          }} 
          icon={<VscDiffAdded />} 
        />
      </Flex>
      <AccordionIcon />
    </AccordionButton>
    <AccordionPanel pt='0.5rem' pb='0.5rem'>
      <Box
        display='grid'
        gridTemplateColumns='repeat(2, 1fr)'
        gap='0.5rem'
      >
        {handlers?.map((h: any) => (
          <Box borderWidth='2px' borderRadius='lg' borderStyle='dashed' p={2}>
            <Box marginBottom='0.5rem'>
              <Text>Handler:</Text> <Tag size='sm' borderRadius='full' variant='solid'>
                <TagLabel>{h.id} {deep.nameLocal(h.id)}</TagLabel>
                <TagCloseButton onClick={() => onDeleteHandler(h.id)}/>
              </Tag> {h.inByType[deep.idLocal('@deep-foundation/core', 'Contain')]?.[0]?.value?.value || ''}
            </Box>
            <Box
              width='100%' 
              sx={{
                '& > *:not(:last-of-type)': {
                  mb: '0.5rem',
                }
              }}
            >
              {support?.outByType[deep.idLocal('@deep-foundation/core', 'SupportsCompatable')]?.map(({ to: handle }) => (
                <CytoEditorHandlersSupportHandle support={support} handler={h} handle={handle} portalRef={portalRef}/>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </AccordionPanel>
  </AccordionItem>;
});

export const CytoEditorHandlers = React.memo(function CytoEditorHandlers({
  linkId,
  handleredableIds,
}: {
  linkId: number;
  handleredableIds: number[];
}) {
  const deep = useDeep();

  useDeepSubscription({
    down: {
      link: { 
        type_id: { _in: [
          deep.idLocal('@deep-foundation/core', 'Supports'),
          deep.idLocal('@deep-foundation/core', 'SupportsCompatable'),
          deep.idLocal('@deep-foundation/core', 'HandleOperation'),
        ] },
      },
    },
  });

  useDeepSubscription({
    up: {
      parent: { 
        type_id: { _in: [
          deep.idLocal('@deep-foundation/core', 'Supports'),
          deep.idLocal('@deep-foundation/core', 'SupportsCompatable'),
          deep.idLocal('@deep-foundation/core', 'HandleOperation'),
        ] },
      },
    },
  });

  useDeepSubscription({
    in: { type_id: deep.idLocal('@deep-foundation/core', 'SupportsCompatable') },
  });

  const supports = deep.useMinilinksSubscription({
    type_id: deep.idLocal('@deep-foundation/core', 'Supports'),
  });

  const portalRef = useRef();

  return <>
    <Box position="relative">
      <div ref={portalRef}/>
      <Box h='100%' w='100%' overflowY="scroll" position="absolute">
        <Accordion allowMultiple>
          {supports?.map((support) => {
            return <CytoEditorHandlersSupport support={support} linkId={linkId} handleredableIds={handleredableIds} portalRef={portalRef}/>;
          })}
        </Accordion>
      </Box>
    </Box>
  </>;
});

