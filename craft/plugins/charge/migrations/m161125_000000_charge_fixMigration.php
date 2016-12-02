<?php
namespace Craft;

class m161125_000000_charge_fixMigration extends BaseMigration
{
    public function safeUp()
    {
        // Now go over all the charges in the system and extract the currency and amounts and populate
        $this->populateAmountCurrency();

        return true;
    }

    private function populateAmountCurrency()
    {
        $records = ChargeRecord::model()->findAll();
        // We'll dump all the update data into a raw sql update
        // to save a ton of time
        $data = [];

        foreach($records as $record) {
            $temp = [];
            $update = false;
            if(isset($record->request['planCurrency'])) {
                $update = true;
                $record->currency = $record->request['planCurrency'];
            }
            if(isset($record->request['planAmount'])) {
                $update = true;
                $record->amount = $record->request['planAmount'];
            }

            if($update) {
                $record->save();
            }
        }
    }
}
