import React, { useMemo } from 'react';
import { Input, HStack, Button, useColorMode, ButtonGroup, FormControl, FormLabel, Switch, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';
import { FinderPopover } from '../cyto/hooks';
import { useSpaceId } from '../hooks';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';


export const EditorSwitcher = React.memo(({
  area,
  setArea,
  rightArea,
  fillSize,
  setFillSize,
  currentLinkId,
  setCurrentLinkId,
  portalRef,
}:{
  area?: string;
  setArea?: (e: any) => any; 
  rightArea?: string;
  setCurrentLinkId?: (currentLinkId: number) => any;
  currentLinkId: number;
  setFillSize?: (fillSize: boolean) => any;
  fillSize: boolean;
  portalRef?: any;
}) => {
  const deep = useDeep();
  const { colorMode } = useColorMode();
  const PortalProps = useMemo(() => ({
    containerRef: portalRef,
  }), []);
  const [space] = useSpaceId();
  const [spaceL] = deep.useMinilinksSubscription({ id: space });

  return(
    <HStack 
      spacing={4} 
      width='100%'
      justifyContent='flex-end' 
      px={4} py={2} 
      borderTopStyle='solid' 
      borderTopWidth={1} 
      borderTopColor='borderColor'
    >
      {area == 'preview' && <>
        <FormControl display='flex' alignItems='center'>
          <FormLabel htmlFor='input-id' mb='0'>
            id
          </FormLabel>
          <InputGroup
            // position='absolute' w='100%' 
            // size='md' h='100%' left={0} top={0} borderWidth='1px' borderRadius='lg' bgColor='handlersInput'
            mr='1rem' 
          >
            <Input id="input-id" value={currentLinkId} size='sm' onChange={(e) => setCurrentLinkId(parseInt(e.target.value) || 0)}/>
            <InputRightElement>
              <FinderPopover
                PortalProps={PortalProps}
                link={spaceL}
                onSubmit={async (link) => {
                  setCurrentLinkId(link?.id);
                }}
              >
                <IconButton
                  isRound
                  aria-label='finder'
                  size='sm'
                  variant='ghost'
                  icon={<>🪬</>}
                  style={{
                    position: 'relative',
                    top: -4,
                  }}
                />
              </FinderPopover>
            </InputRightElement>
          </InputGroup>
          <FormLabel htmlFor='show-extra-switch' mb='0'>
            fillSize
          </FormLabel>
          <Switch id='show-extra-switch' isChecked={fillSize} onChange={() => setFillSize(!fillSize)}/>
        </FormControl>
      </>}
      <ButtonGroup size='sm' isAttached variant='outline'>
        <Button 
          aria-label='Preview area'
          value='preview'
          isDisabled={area == 'preview'}
          onClick={() => setArea('preview')}
        >Preview</Button>
        <Button 
          aria-label='Handlers area'
          value='handlers'
          isDisabled={area == 'handlers'}
          onClick={() => setArea('handlers')}
        >Handlers</Button>
        <Button 
          aria-label='Results area'
          value='results'
          isDisabled={area == 'results'}
          onClick={() => setArea('results')}
        >Results</Button>
      </ButtonGroup>
    </HStack>
  )
})