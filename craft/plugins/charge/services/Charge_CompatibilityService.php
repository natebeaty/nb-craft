<?php
namespace Craft;

class Charge_CompatibilityService extends BaseApplicationComponent
{
    private $messages = [];
    /*
    * Test
    *
    * Tests all the active compatibilty tests for the current server
    *
    * @returns array
    */
    public function test()
    {
        $this->testTLS12minimum();

        return $this->messages;
    }


    public function testTLS12minimum()
    {
        // Test key supplied by Stripe
        \Stripe\Stripe::setApiKey("sk_test_BQokikJOvBiI2HlWgH4olfQ2");
        \Stripe\Stripe::$apiBase = "https://api-tls12.stripe.com";

        try {
          \Stripe\Charge::all();
          // All good.
          return;
        } catch (\Stripe\Error\ApiConnection $e) {

            // Oh noes!
              $this->messages[] = [
                'level' => 'critical',
                'message' => 'This server doesn\'t support TLS 1.2. You will need to upgrade to continue.',
                'action' => '/some/link'
            ];
        }

    }

}
