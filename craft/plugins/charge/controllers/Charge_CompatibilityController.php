<?php
namespace Craft;

class Charge_CompatibilityController extends Charge_BaseCpController
{
    public function actionIssue(array $variables = [])
    {
        $this->requireAdmin();

        $this->renderTemplate('charge/settings/compatibility/issue', $variables);
    }




}
