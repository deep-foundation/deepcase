import { Box, CloseButton as _CloseButton, Flex, IconButton, Spinner, useColorMode } from '@chakra-ui/react';
import { AnimatePresence, Reorder } from 'framer-motion';
import React, { useState } from 'react';
import { isAndroid, isIOS } from 'react-device-detect';
import { VscChromeClose } from 'react-icons/vsc';
import { useChackraColor } from '../get-color';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';

interface ITab {
  id: number;
  title: string;
  saved?: boolean;
  loading?: boolean;
  active?: boolean;
};

export const EditorTabs_ = React.memo<any>(({
  tabs=[],
  onClick,
  onClose,
}: {
  tabs?: ITab[];
  onClick?: (tab: ITab) => void;
  onClose?: (tab: ITab) => void;
}) => {
  const gray900 = useChackraColor('gray.900');
  const white = useChackraColor('white');
  const { colorMode } = useColorMode();

return (<Flex
      position="sticky"
      top="0"
      bg={colorMode == 'light' ? white : gray900}
      zIndex="sticky"
      height="max-content"
      alignItems="center"
      flexWrap="nowrap"
      overflowX="auto"
      borderBottomStyle='solid' borderBottomWidth={1} borderBottomColor={colorMode == 'light' ? 'blackAlpha.200' : 'whiteAlpha.200'}
      as="nav"
      css={{
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "-ms-autohiding-scrollbar"
      }}
    >
      <Flex flex="0 0 auto">
        {tabs.map(t =>
          <EditorTab key={t.id} tab={t} onClick={onClick} onClose={onClose} />
        )}
      </Flex>
    </Flex>
  )
})

export const NonSavedIcon = React.memo<any>(({
  bg='primary',
  borderColor='red.200',
}:{
  bg?: string;
  borderColor?: string;
}) => {
  
  return (<Box w='0.5rem' h='0.5rem' bg={bg} borderStyle='solid' borderWidth={1} borderColor={borderColor} borderRadius='full' />)
})

export const CloseButton = React.memo<any>(({
  onClick,
}: {
  onClick?: (event) => void;
}) => {
  const gray900 = useChackraColor('gray.900');
  const white = useChackraColor('white');
  const { colorMode } = useColorMode();

  return <_CloseButton size='md' bg={colorMode == 'light' ? white : gray900} borderRadius='none' height='100%' borderStyle='solid' borderWidth={1} borderColor={colorMode == 'light' ? 'blackAlpha.200' : 'whiteAlpha.200'} onClick={onClick} />
})

export interface ITabProps {
  tab: ITab;
  onClick?: (tab: ITab) => void;
  onClose?: (tab: ITab) => void;
  onSaveTab?: (tab: ITab) => void;
}

export const EditorTab = React.memo<any>(({
  tab,
  onClick,
  onSaveTab,
  onClose,
}:ITabProps) => {
  const {
    id,
    saved = false,
    loading = false,
    active = false,
  } = tab;
  const gray900 = useChackraColor('gray.900');
  const white = useChackraColor('white');
  const { colorMode } = useColorMode();
  const deep = useDeep();

  const [currentSymbolLink] = deep.useMinilinksSubscription({ type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), to_id: id || 0 });
  const currentSymbol = currentSymbolLink?.value?.value;
  const [typeSymbolLink] = deep.useMinilinksSubscription({ type_id: deep.idLocal('@deep-foundation/core', 'Symbol'), to_id: deep.minilinks.byId[id]?.type_id || 0 });
  const [containLink] = deep.useMinilinksSubscription({ type_id: deep.idLocal('@deep-foundation/core', 'Contain'), to_id: id });
  const typeSymbol = typeSymbolLink?.value?.value;
  const symbol = currentSymbol || typeSymbol || '';
  const title = containLink?.value?.value;

  return (<Reorder.Item
      value={tab}
      as='div'
      id={`tab-${id}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        // backgroundColor: active ? "#f3f3f3" : "#fff",
        y: 0,
        transition: { duration: 0.15 }
      }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
      // whileDrag={{ backgroundColor: "#e3e3e3" }}
      className='tab'
      onPointerDown={() => onClick && onClick(tab)}
    >
      <Box
        as='button'
        aria-label={`tab-${id}`}
        display='flex'
        alignItems='center'
        w='max'
        h='max'
        lineHeight='1.4'
        transition='all 0.2s cubic-bezier(.08,.52,.52,1)'
        // border='none'
        pl='3'
        pr='2'
        py='2'
        borderRadius='none'
        fontSize='xs'
        fontWeight='normal'
        bg={active ? 'handlersInput' : 'bgLanguagesButton'}
        borderRightWidth='thin'
        borderRightColor='borderColor' 
        // _notLast={{ 
        // }}
        _hover={{ bg: active ? 'handlersInput' : 'whiteGray' }}
        _active={{
          transform: 'scale(0.98)',
        }}
        // _focus={{
        //   bg: 'text'
        // }}
      >
        <Box flex='1' mr='2'>
          {symbol ? `${symbol} ` : ''}{title}
        </Box>
        {isIOS || isAndroid
        ? <IconButton
            colorScheme='gray'
            isRound
            size='xs'
            onClick={() => onSaveTab && onSaveTab(tab)}
            aria-label='Save button'
            icon={!saved && <NonSavedIcon /> || loading && <Spinner size='xs' />}
          />
        : <Box mr='3'>
          {!saved && <NonSavedIcon /> || loading && <Spinner size='xs' />}
        </Box>}
        <Box 
          onClick={(e: any) => {
            e?.stopPropagation();
            onClose && onClose(tab);
          }} 
          as='button' 
          aria-label='close tab button'
          borderRadius='md'
          p={1}
          _hover={{
            bg: colorMode == 'light' ? 'blackAlpha.100' : 'gray.700',
          }}
        >
          <VscChromeClose />
        </Box>
      </Box>
    </Reorder.Item>
  )
})

export const EditorTabs = React.memo<any>(({
  tabs=[],
  setTabs,
  onClick,
  onClose,
  onSaveTab,
}: {
  tabs?: ITab[];
  setTabs?: (tabs: ITab[]) => void;
  onClick?: (tab: ITab) => void;
  onClose?: (tab: ITab) => void;
  onSaveTab?: (tab: ITab) => void;
}) => {
  const gray900 = useChackraColor('gray.900');
  const white = useChackraColor('white');
  const { colorMode } = useColorMode();

  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  // const remove = (item: Ingredient) => {
  //   if (item === selectedTab) {
  //     setSelectedTab(closestItem(tabs, item));
  //   }

  //   setTabs(removeItem(tabs, item));
  // };

  // const add = () => {
  //   const nextItem = getNextIngredient(tabs);

  //   if (nextItem) {
  //     setTabs([...tabs, nextItem]);
  //     setSelectedTab(nextItem);
  //   }
  // };

return (<Reorder.Group
    as='div'
    axis="x"
    onReorder={setTabs}
    style={{
      display: 'flex',
      position: "sticky",
      top: 0,
      // background: colorMode == 'light' ? white : gray900,
      zIndex: "sticky",
      height: "max-content",
      alignItems :"center",
      flexWrap: "nowrap",
      overflowX: "auto",
      borderBottomWidth: 'thin', 
      borderBottomColor: colorMode == 'light' ? 'blackAlpha.200' : 'whiteAlpha.200',
      WebkitOverflowScrolling: "touch",
      msOverflowStyle: "-ms-autohiding-scrollbar",
    }}
    values={tabs}
  >
    <AnimatePresence initial={false}>
      {tabs.map(t =>
        <EditorTab key={t} tab={t} onClick={onClick} onSaveTab={onSaveTab} onClose={onClose} />
      )}
    </AnimatePresence>
  </Reorder.Group>)
})