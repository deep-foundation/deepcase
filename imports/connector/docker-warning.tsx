import React from 'react';
import { Box, Link, Text } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';


export const DockerWarning = React.memo(() => {
  return (<Box pr={4} pl={4} pt={4} textAlign='center'>
      <Text color='yellow.400' fontSize='xs'>
        Docker is not detected.
        Check that Docker is installed and started.
        <br/>
        <Link href='https://docs.docker.com/engine/install' isExternal color='yellow.400'>
          Install Docker <ExternalLinkIcon ml='2px' />
        </Link>
      </Text>
    </Box>
  )
}) 
