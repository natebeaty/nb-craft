<?php
namespace Craft;

class m161116_000000_charge_addAmountCurrencyCols extends BaseMigration
{
    /**
     * Any migration code in here is wrapped inside of a transaction.
     *
     * @return bool
     */
    public function safeUp()
    {
        $chargesTable = $this->dbConnection->schema->getTable('{{charges}}');

        if ($chargesTable->getColumn('amount') === null) {
            $this->addColumnAfter('charges', 'amount', array('column' => ColumnType::Varchar), 'request');
        }

        if ($chargesTable->getColumn('currency') === null) {
            $this->addColumnAfter('charges', 'currency', array('column' => ColumnType::Varchar), 'request');
        }


        return true;
    }
}
