import styled from 'styled-components'
import colors from './colors'

type SubtitleProps = {
  align?: 'left' | 'right' | 'justify'
}

export const Subtitle = styled.h2`
  font-size: 16px;
  flex: 1 1 0;
  height: 100%;
  font-weight: 600;
  color: ${colors.black};
  text-align: ${(props: SubtitleProps) => props.align || 'center'};

  @media (max-width: 700px) {
    font-size: 12px;
  }
`

export const Text = styled.p`
  font-size: 14px;
  font-weight: 300;
  color: ${colors.grey};
`
