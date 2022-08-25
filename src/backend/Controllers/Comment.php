<?php

namespace Espo\Modules\Comments\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Exceptions\NotFound;

class Comment extends \Espo\Core\Templates\Controllers\Base
{
    /**
     * @throws BadRequest
     * @throws ForbiddenSilent
     * @throws NotFound
     */
    public function getActionCommentThreadTree(Request $request): object
    {
        $threadId = $request->getQueryParam('threadId') ?? null;

        if (empty($threadId)) {
            throw new BadRequest();
        }

        return (object)$this->getRecordService()->getCommentThreadTree($threadId);
    }

    /**
     * @throws BadRequest
     * @throws Forbidden
     */
    public function getActionListForEntity(Request $request, Response $response): \stdClass
    {
        $params = $request->getRouteParams();
        $scope = $params['scope'] ?? null;
        $id = $params['id'] ?? null;

        if (empty($scope) || empty($id)) {
            throw new BadRequest();
        }

        $searchParams = $this->fetchSearchParamsFromRequest($request);
        $recordCollection = $this->getRecordService()->findForEntity($scope, $id, $searchParams);

        return (object)[
            'total' => $recordCollection->getTotal(),
            'list' => $recordCollection->getValueMapList(),
        ];
    }
}
