import React from 'react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { getSettingsRoute } from '../../lib/url-helpers';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledModal, { ModalFooter, ModalHeader } from '../StyledModal';
import { Label, P } from '../Text';

export default function TwoFactorAuthenticationModal() {
  const { LoggedInUser } = useLoggedInUser();
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const prompt = useTwoFactorAuthenticationPrompt();

  const cancel = React.useCallback(() => {
    setTwoFactorCode('');
    prompt.rejectAuth(createError(ERROR.TWO_FACTOR_AUTH_CANCELED));
  }, []);

  const confirm = React.useCallback(() => {
    const code = twoFactorCode;
    setTwoFactorCode('');
    prompt.resolveAuth({
      type: 'totp',
      code,
    });
  }, [twoFactorCode]);

  const router = useRouter();

  React.useEffect(() => {
    const handleRouteChange = () => {
      cancel();
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [cancel]);

  if (prompt?.isOpen) {
    const has2FAConfigured = prompt.supportedMethods.length > 0;

    return (
      <StyledModal onClose={cancel} trapFocus>
        <ModalHeader hideCloseIcon>
          {has2FAConfigured ? (
            <FormattedMessage defaultMessage="Verify using the Two-Factor Authentication (2FA) code:" />
          ) : (
            <FormattedMessage defaultMessage="You must configure Two-Factor Authentication (2FA) to access this feature." />
          )}
        </ModalHeader>
        {has2FAConfigured ? (
          <Flex mt={2} flexDirection="column">
            <Label htmlFor="2fa-code-input" fontWeight="normal" as="label" mb={2}>
              <FormattedMessage defaultMessage="Please enter your 6-digit code without any dashes." />
            </Label>
            <StyledInput
              id="2fa-code-input"
              name="2fa-code-input"
              type="text"
              minHeight={50}
              fontSize="20px"
              placeholder="123456"
              pattern="[0-9]{6}"
              inputMode="numeric"
              value={twoFactorCode}
              onChange={e => setTwoFactorCode(e.target.value)}
              autoFocus
            />
          </Flex>
        ) : (
          <Flex mt={2} flexDirection="column">
            <P fontWeight="normal" as="label" mb={4}>
              <FormattedMessage
                defaultMessage="To enable Two-Factor Authentication (2FA), follow the steps <link>here</link>"
                values={{
                  link: getI18nLink({
                    href: getSettingsRoute(LoggedInUser.collective, 'two-factor-auth'),
                    as: Link,
                  }),
                }}
              />
            </P>
          </Flex>
        )}
        <ModalFooter isFullWidth dividerMargin="1rem 0">
          <Flex justifyContent="right" flexWrap="wrap">
            <StyledButton mr={2} minWidth={120} onClick={cancel}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              ml={2}
              minWidth={120}
              buttonStyle="primary"
              disabled={twoFactorCode === '' || !has2FAConfigured}
              onClick={confirm}
            >
              <FormattedMessage id="actions.verify" defaultMessage="Verify" />
            </StyledButton>
          </Flex>
        </ModalFooter>
      </StyledModal>
    );
  }

  return null;
}