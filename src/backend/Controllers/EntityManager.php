<?php

namespace Espo\Modules\Comments\Controllers;

use Espo\Core\{
    Api\Request,
    Di\MetadataAware,
    Di\MetadataSetter,
    Exceptions\BadRequest,
    Exceptions\Error};

class EntityManager extends \Espo\Controllers\EntityManager implements MetadataAware
{
    use MetadataSetter;

    /**
     * @throws BadRequest
     * @throws Error
     */
    public function postActionToggleComments(Request $request): bool
    {
        $data = $request->getParsedBody();

        if (empty($data->scope) || !isset($data->commentsEnabled)) {
            throw new BadRequest();
        }

        $name = $data->scope;

        if (!$this->metadata->get('scopes.' . $name)) {
            throw new Error('Entity [' . $name . '] does not exist.');
        }

        $this->metadata->set('scopes', $name, [
            'comments' => $data->commentsEnabled === true,
        ]);
        $this->metadata->save();

        return true;
    }
}
